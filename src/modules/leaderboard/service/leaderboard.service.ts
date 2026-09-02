import { Injectable } from '@nestjs/common';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { LeaderboardSnapshotRepo, UserGamificationStatRepo } from '~/repositories';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly leaderboardSnapshotRepo: LeaderboardSnapshotRepo,
    private readonly userGamificationStatRepo: UserGamificationStatRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  private periodKey(period: string) {
    if (period === enumData.LEADERBOARD_PERIOD.ALL_TIME.code) return 'ALL';
    return new Date().toISOString().slice(0, 10);
  }

  async getSnapshots(
    boardType: string = enumData.LEADERBOARD_BOARD_TYPE.STUDY_POINTS.code,
    period: string = enumData.LEADERBOARD_PERIOD.ALL_TIME.code,
  ) {
    const periodKey = this.periodKey(period);
    const snapshots = await this.leaderboardSnapshotRepo.find({
      where: { boardType, period, periodKey, isDeleted: false },
      order: { rank: 'ASC' },
      take: 100,
      relations: { user: true },
    });
    if (snapshots.length) return { data: transformKeys(snapshots) };

    const stats = await this.userGamificationStatRepo.find({
      order: { totalPoints: 'DESC', createdAt: 'ASC' },
      take: 100,
      relations: { user: true },
    });
    return {
      data: transformKeys(
        stats.map((item, index) => ({
          id: item.id,
          boardType,
          period,
          periodKey,
          userId: item.userId,
          rank: index + 1,
          score: item.totalPoints,
          metadataJson: {
            username: item.user?.username || item.user?.email || 'Learner',
            currentStreakDays: item.currentStreakDays,
          },
        })),
      ),
    };
  }
}
