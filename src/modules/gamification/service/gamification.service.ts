import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, MoreThanOrEqual } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DefTransaction } from '~/common/core/decorator';
import { enumData } from '~/common/enums/base.enum';
import {
  createdEntityId,
  excelExportTake,
  optionalNumber,
  optionalText,
  parseJsonValue,
  requireText,
  runBulkImport,
  transformKeys,
} from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { AchievementEntity, DailyChallengeEntity } from '~/entities';
import {
  AchievementRepo,
  DailyChallengeRepo,
  PointLedgerEntryRepo,
  UserAchievementRepo,
  UserDailyActivityRepo,
  UserDailyChallengeProgressRepo,
  UserGamificationStatRepo,
} from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import {
  ChallengeProgressDto,
  CreateAchievementDto,
  CreateDailyChallengeAdminDto,
  FilterGamificationDto,
  PracticePointsDto,
  UpdateAchievementDto,
  UpdateDailyChallengeAdminDto,
} from '../dto';

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
    let activity = await this.userDailyActivityRepo.findOne({
      where: { userId, activityDate: today },
    });
    if (!activity) {
      activity = await this.userDailyActivityRepo.save(
        this.userDailyActivityRepo.create({
          id: uuidv4(),
          userId,
          activityDate: today,
          studyMinutes: 0,
          lessonsCompleted: 0,
          questionsAnswered: 0,
          vocabReviewed: 0,
          arenaMatches: 0,
          pointsEarned: 0,
          streakCount: 0,
          goalMet: false,
          createdBy: userId,
        }),
      );
    }
    activity.pointsEarned += amount;
    return this.userDailyActivityRepo.save(activity);
  }

  async awardPoints(
    userId: string,
    amount: number,
    reason: string,
    refType?: string,
    refId?: string,
    description?: string,
  ) {
    if (!amount) return this.getOrCreateStats(userId);
    const stats = await this.getOrCreateStats(userId);
    const today = this.today();
    if (stats.lastActivityDate !== today) {
      stats.currentStreakDays =
        stats.lastActivityDate === this.yesterday() ? stats.currentStreakDays + 1 : 1;
      stats.longestStreakDays = Math.max(stats.longestStreakDays || 0, stats.currentStreakDays);
      stats.lastActivityDate = today;
    }
    stats.totalPoints += amount;
    const saved = await this.userGamificationStatRepo.save(stats);
    await this.pointLedgerEntryRepo.save(
      this.pointLedgerEntryRepo.create({
        id: uuidv4(),
        userId,
        points: amount,
        reason,
        sourceType: refType,
        sourceId: refId,
        earnedAt: new Date(),
        createdBy: userId,
      }),
    );
    await this.bumpDailyPoints(userId, amount);
    await this.unlockAchievements(userId, saved);
    return saved;
  }

  private achievementThreshold(condition: Record<string, unknown>) {
    const pointsRequired = Number(
      condition.pointsRequired ?? condition.points ?? condition.value ?? 0,
    );
    const type = String(condition.type || 'points');
    return { type, value: pointsRequired };
  }

  private async unlockAchievements(
    userId: string,
    stats: { totalPoints: number; currentStreakDays: number },
  ) {
    const achievements = await this.achievementRepo.find({ where: { isDeleted: false } });
    for (const achievement of achievements) {
      const existing = await this.userAchievementRepo.findOne({
        where: { userId, achievementId: achievement.id },
      });
      if (existing) continue;
      const { type, value } = this.achievementThreshold(achievement.criteriaJson || {});
      const met =
        type === 'streak'
          ? Number(stats.currentStreakDays || 0) >= value
          : Number(stats.totalPoints || 0) >= value;
      if (!met || !value) continue;
      await this.userAchievementRepo.save(
        this.userAchievementRepo.create({
          id: uuidv4(),
          userId,
          achievementId: achievement.id,
          earnedAt: new Date(),
          createdBy: userId,
        }),
      );
    }
  }

  async getMyStats(user: UserDto) {
    const stats = await this.getOrCreateStats(user.id);
    return { data: transformKeys(stats) };
  }

  async getTodayChallenges(user: UserDto) {
    const today = this.today();
    const challenges = await this.dailyChallengeRepo.find({
      where: { isDeleted: false, activeDate: today },
      order: { createdAt: 'ASC' },
    });
    const progress = await this.userDailyChallengeProgressRepo.find({
      where: { userId: user.id },
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
    const challenge = await this.dailyChallengeRepo.findOne({
      where: { code, isDeleted: false },
    });
    if (!challenge)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.daily_challenge'));

    let progress = await this.userDailyChallengeProgressRepo.findOne({
      where: { userId: user.id, dailyChallengeId: challenge.id },
    });
    if (!progress) {
      progress = this.userDailyChallengeProgressRepo.create({
        id: uuidv4(),
        userId: user.id,
        dailyChallengeId: challenge.id,
        progressCount: 0,
        pointsAwarded: 0,
        createdBy: user.id,
      });
    }
    progress.progressCount += dto.increment || 1;
    if (!progress.completedAt && progress.progressCount >= challenge.targetCount) {
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
    const alreadyAwarded = todayReviewPoints.reduce(
      (sum, item) => sum + Number(item.points || 0),
      0,
    );
    const amount = Math.min(50 - alreadyAwarded, Math.max(0, dto.count * 10));
    if (amount > 0) {
      await this.awardPoints(
        user.id,
        amount,
        enumData.POINT_REASON.REVIEW.code,
        'practice',
        today,
        'Điểm luyện tập hằng ngày',
      );
    }
    return { data: transformKeys(await this.getOrCreateStats(user.id)), awarded: amount };
  }

  private actorName(user: UserDto) {
    return user.fullName || user.name || user.username || user.email || 'Admin';
  }

  private achievementPayload(item: AchievementEntity) {
    const data = transformKeys(item) as Record<string, unknown>;
    return {
      ...data,
      name: item.title,
      points: item.rewardPoints,
      conditionJson: item.criteriaJson,
      iconMediaAssetId: item.iconUrl,
    };
  }

  private async writeLog(
    user: UserDto,
    actionType: string,
    entityType: string,
    entityId: string,
    description: string,
  ) {
    await this.actionLogService.create({
      entityId,
      entityType,
      actionType,
      createdBy: user.id,
      actorCode: user.username || user.email || user.id,
      actorName: this.actorName(user),
      description,
      dataBefore: '{}',
      dataAfter: '{}',
    });
  }

  async paginationAchievements(body: PaginationDto<FilterGamificationDto>) {
    const { skip = 0, take = 20, where = {} as FilterGamificationDto } = body;
    const whereCon: FindOptionsWhere<AchievementEntity> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.title = UnaccentILike(`%${where.keyword}%`);
    const [data, total] = await this.achievementRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
    });
    return { data: data.map(item => this.achievementPayload(item)), total };
  }

  async findAchievement(id: string) {
    const item = await this.achievementRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.achievement'));
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: this.achievementPayload(item),
    };
  }

  @DefTransaction()
  async createAchievement(dto: CreateAchievementDto, user: UserDto) {
    const exist = await this.achievementRepo.findOne({ where: { code: dto.code } });
    if (exist) throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    const item = await this.achievementRepo.save(
      this.achievementRepo.create({
        id: uuidv4(),
        code: dto.code,
        title: dto.name,
        description: dto.description,
        category: dto.category,
        iconUrl: dto.iconMediaAssetId,
        criteriaJson: dto.conditionJson || {},
        rewardPoints: dto.points ?? 0,

        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'AchievementEntity',
      item.id,
      `Tạo thành tích: ${item.code}`,
    );
    return this.findAchievement(item.id);
  }

  @DefTransaction()
  async updateAchievement(id: string, dto: UpdateAchievementDto, user: UserDto) {
    const item = await this.achievementRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.achievement'));
    if (dto.code && dto.code !== item.code) {
      const exist = await this.achievementRepo.findOne({ where: { code: dto.code } });
      if (exist && exist.id !== id)
        throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
    Object.assign(item, {
      code: dto.code ?? item.code,
      title: dto.name ?? item.title,
      description: dto.description,
      category: dto.category ?? item.category,
      iconUrl: dto.iconMediaAssetId || item.iconUrl,
      criteriaJson: dto.conditionJson || item.criteriaJson,
      rewardPoints: dto.points ?? item.rewardPoints,

      updatedBy: user.id,
    });
    await this.achievementRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'AchievementEntity',
      id,
      `Cập nhật thành tích: ${item.code}`,
    );
    return this.findAchievement(id);
  }

  @DefTransaction()
  async deactivateAchievement(id: string, user: UserDto) {
    const item = await this.achievementRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.achievement'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.achievementRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'AchievementEntity',
      id,
      `Ngưng thành tích: ${item.code}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activateAchievement(id: string, user: UserDto) {
    const item = await this.achievementRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.achievement'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.achievementRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'AchievementEntity',
      id,
      `Kích hoạt thành tích: ${item.code}`,
    );
    return this.findAchievement(id);
  }

  async paginationDailyChallenges(body: PaginationDto<FilterGamificationDto>) {
    const { skip = 0, take = 20, where = {} as FilterGamificationDto } = body;
    const whereCon: FindOptionsWhere<DailyChallengeEntity> = {
      isDeleted: where.isDeleted ?? false,
    };
    if (where.keyword) whereCon.title = UnaccentILike(`%${where.keyword}%`);
    const [data, total] = await this.dailyChallengeRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
    });
    return { data: transformKeys(data), total };
  }

  async findDailyChallenge(id: string) {
    const item = await this.dailyChallengeRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.daily_challenge'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  @DefTransaction()
  async createDailyChallenge(dto: CreateDailyChallengeAdminDto, user: UserDto) {
    const activeDate = dto.activeDate || this.today();
    const exist = await this.dailyChallengeRepo.findOne({ where: { code: dto.code, activeDate } });
    if (exist) throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    const item = await this.dailyChallengeRepo.save(
      this.dailyChallengeRepo.create({
        id: uuidv4(),
        code: dto.code,
        title: dto.title,
        challengeType: dto.challengeType,
        targetCount: dto.targetCount ?? 1,
        rewardPoints: dto.rewardPoints ?? 0,
        activeDate,

        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'DailyChallengeEntity',
      item.id,
      `Tạo thử thách ngày: ${item.code}`,
    );
    return this.findDailyChallenge(item.id);
  }

  @DefTransaction()
  async updateDailyChallenge(id: string, dto: UpdateDailyChallengeAdminDto, user: UserDto) {
    const item = await this.dailyChallengeRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.daily_challenge'));
    if (dto.code && dto.code !== item.code) {
      const exist = await this.dailyChallengeRepo.findOne({ where: { code: dto.code } });
      if (exist && exist.id !== id)
        throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
    Object.assign(item, {
      code: dto.code ?? item.code,
      title: dto.title ?? item.title,
      challengeType: dto.challengeType ?? item.challengeType,
      targetCount: dto.targetCount ?? item.targetCount,
      rewardPoints: dto.rewardPoints ?? item.rewardPoints,
      activeDate: dto.activeDate || item.activeDate,

      updatedBy: user.id,
    });
    await this.dailyChallengeRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'DailyChallengeEntity',
      id,
      `Cập nhật thử thách ngày: ${item.code}`,
    );
    return this.findDailyChallenge(id);
  }

  @DefTransaction()
  async deactivateDailyChallenge(id: string, user: UserDto) {
    const item = await this.dailyChallengeRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.daily_challenge'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.dailyChallengeRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'DailyChallengeEntity',
      id,
      `Ngưng thử thách ngày: ${item.code}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activateDailyChallenge(id: string, user: UserDto) {
    const item = await this.dailyChallengeRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.daily_challenge'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.dailyChallengeRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'DailyChallengeEntity',
      id,
      `Kích hoạt thử thách ngày: ${item.code}`,
    );
    return this.findDailyChallenge(id);
  }

  async importAchievements(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const created = await this.createAchievement(
        {
          code: requireText(item.code, 'Mã'),
          name: requireText(item.name, 'Tên'),
          nameEn: optionalText(item.nameEn),
          description: optionalText(item.description),
          category: requireText(item.category, 'Nhóm'),
          conditionJson: parseJsonValue(item.conditionJson, {}) || {},
          points: optionalNumber(item.points, 0),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportAchievements(body: PaginationDto<FilterGamificationDto>) {
    const { data } = await this.paginationAchievements({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }

  async importDailyChallenges(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const created = await this.createDailyChallenge(
        {
          code: requireText(item.code, 'Mã'),
          title: requireText(item.title, 'Tiêu đề'),
          titleEn: optionalText(item.titleEn),
          description: optionalText(item.description),
          challengeType: requireText(item.challengeType, 'Loại thử thách'),
          targetCount: optionalNumber(item.targetCount, 1),
          rewardPoints: optionalNumber(item.rewardPoints, 0),
          activeDate: optionalText(item.activeDate),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportDailyChallenges(body: PaginationDto<FilterGamificationDto>) {
    const { data } = await this.paginationDailyChallenges({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }
}
