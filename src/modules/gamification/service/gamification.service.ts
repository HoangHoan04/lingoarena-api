import { Injectable, NotFoundException } from '@nestjs/common';
import { MoreThanOrEqual } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { UserDto } from '~/dto';
import {
  AchievementRepo,
  DailyChallengeRepo,
  PointLedgerEntryRepo,
  UserAchievementRepo,
  UserDailyActivityRepo,
  UserDailyChallengeProgressRepo,
  UserGamificationStatRepo,
} from '~/repositories';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import { ChallengeProgressDto, PracticePointsDto } from '../dto';

@Injectable()
export class GamificationService {
  constructor(
    private readonly userGamificationStatRepo: UserGamificationStatRepo,
    private readonly achievementRepo: AchievementRepo,
    private readonly userAchievementRepo: UserAchievementRepo,
    private readonly pointLedgerEntryRepo: PointLedgerEntryRepo,
    private readonly dailyChallengeRepo: DailyChallengeRepo,
    private readonly userDailyChallengeProgressRepo: UserDailyChallengeProgressRepo,
    private readonly userDailyActivityRepo: UserDailyActivityRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  private yesterday() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  private async getOrCreateStats(userId: string) {
    let stats = await this.userGamificationStatRepo.findOne({ where: { userId } });
    if (!stats) {
      stats = await this.userGamificationStatRepo.save(
        this.userGamificationStatRepo.create({
          id: uuidv4(),
          userId,
          totalPoints: 0,
          currentStreakDays: 0,
          longestStreakDays: 0,
          freezeCredits: 0,
          createdBy: userId,
        }),
      );
    }
    return stats;
  }

  private async bumpDailyPoints(userId: string, amount: number) {
    const today = this.today();
    let activity = await this.userDailyActivityRepo.findOne({ where: { userId, activityDate: today } });
    if (!activity) {
      activity = await this.userDailyActivityRepo.save(
        this.userDailyActivityRepo.create({
          id: uuidv4(),
          userId,
          activityDate: today,
          studyMinutes: 0,
          lessonsCompleted: 0,
          questionsAnswered: 0,
          questionsCorrect: 0,
          vocabularyReviewed: 0,
          assessmentsAttempted: 0,
          arenaMatchesPlayed: 0,
          pointsEarned: 0,
          createdBy: userId,
        }),
      );
    }
    activity.pointsEarned += amount;
    return this.userDailyActivityRepo.save(activity);
  }

  async awardPoints(userId: string, amount: number, reason: string, refType?: string, refId?: string, description?: string) {
    if (!amount) return this.getOrCreateStats(userId);
    const stats = await this.getOrCreateStats(userId);
    const today = this.today();
    if (stats.lastActivityDate !== today) {
      stats.currentStreakDays = stats.lastActivityDate === this.yesterday() ? stats.currentStreakDays + 1 : 1;
      stats.longestStreakDays = Math.max(stats.longestStreakDays || 0, stats.currentStreakDays);
      stats.lastActivityDate = today;
    }
    stats.totalPoints += amount;
    const saved = await this.userGamificationStatRepo.save(stats);
    await this.pointLedgerEntryRepo.save(
      this.pointLedgerEntryRepo.create({
        id: uuidv4(),
        userId,
        amount,
        balanceAfter: saved.totalPoints,
        reason,
        refType,
        refId,
        description,
        createdBy: userId,
      }),
    );
    await this.bumpDailyPoints(userId, amount);
    return saved;
  }

  async getMyStats(user: UserDto) {
    const stats = await this.getOrCreateStats(user.id);
    return { data: transformKeys(stats) };
  }

  async getTodayChallenges(user: UserDto) {
    const today = this.today();
    const challenges = await this.dailyChallengeRepo.find({
      where: { isActive: true, isDeleted: false },
      order: { createdAt: 'ASC' },
    });
    const progress = await this.userDailyChallengeProgressRepo.find({
      where: { userId: user.id, activityDate: today },
    });
    const progressByChallenge = new Map(progress.map(item => [item.dailyChallengeId, item]));
    return {
      data: transformKeys(
        challenges.map(challenge => ({
          ...challenge,
          progress: progressByChallenge.get(challenge.id) || null,
        })),
      ),
    };
  }

  async progressChallenge(code: string, dto: ChallengeProgressDto, user: UserDto) {
    const today = this.today();
    const challenge = await this.dailyChallengeRepo.findOne({
      where: { code, isActive: true, isDeleted: false },
    });
    if (!challenge) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.daily_challenge'));

    let progress = await this.userDailyChallengeProgressRepo.findOne({
      where: { userId: user.id, dailyChallengeId: challenge.id, activityDate: today },
    });
    if (!progress) {
      progress = this.userDailyChallengeProgressRepo.create({
        id: uuidv4(),
        userId: user.id,
        dailyChallengeId: challenge.id,
        activityDate: today,
        progressCount: 0,
        targetCount: challenge.targetCount,
        pointsAwarded: 0,
        createdBy: user.id,
      });
    }
    progress.progressCount += dto.increment || 1;
    if (!progress.completedAt && progress.progressCount >= progress.targetCount) {
      progress.completedAt = new Date();
      progress.pointsAwarded = challenge.rewardPoints;
      await this.awardPoints(
        user.id,
        challenge.rewardPoints,
        enumData.POINT_REASON.DAILY_CHALLENGE.code,
        'daily_challenge',
        challenge.id,
        challenge.title,
      );
    }
    progress = await this.userDailyChallengeProgressRepo.save(progress);
    return { data: transformKeys({ challenge, progress }) };
  }

  async awardPracticePoints(dto: PracticePointsDto, user: UserDto) {
    const today = this.today();
    const todayReviewPoints = await this.pointLedgerEntryRepo.find({
      where: {
        userId: user.id,
        reason: enumData.POINT_REASON.REVIEW.code,
        createdAt: MoreThanOrEqual(new Date(`${today}T00:00:00.000Z`)),
      },
    });
    const alreadyAwarded = todayReviewPoints.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const amount = Math.min(50 - alreadyAwarded, Math.max(0, dto.count * 10));
    if (amount > 0) {
      await this.awardPoints(user.id, amount, enumData.POINT_REASON.REVIEW.code, 'practice', today, 'Điểm luyện tập hằng ngày');
    }
    return { data: transformKeys(await this.getOrCreateStats(user.id)), awarded: amount };
  }
}
