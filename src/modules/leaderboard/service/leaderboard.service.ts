import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DefTransaction } from '~/common/core/decorator';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { UserDto } from '~/dto';
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
    });
    if (snapshots.length) return { data: transformKeys(snapshots) };

    const stats = await this.userGamificationStatRepo.find({
      order: { totalPoints: 'DESC', createdAt: 'ASC' },
      take: 100,
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
            currentStreakDays: item.currentStreakDays,
          },
        })),
      ),
    };
  }

  @DefTransaction()
  async rebuildSnapshots(user: UserDto) {
    const boardType = enumData.LEADERBOARD_BOARD_TYPE.STUDY_POINTS.code;
    const period = enumData.LEADERBOARD_PERIOD.ALL_TIME.code;
    const periodKey = this.periodKey(period);
    const existing = await this.leaderboardSnapshotRepo.find({
      where: { boardType, period, periodKey },
    });
    if (existing.length) await this.leaderboardSnapshotRepo.remove(existing);
    const stats = await this.userGamificationStatRepo.find({
      order: { totalPoints: 'DESC', createdAt: 'ASC' },
      take: 100,
    });
    const now = new Date();
    const rows = stats.map((item, index) =>
      this.leaderboardSnapshotRepo.create({
        id: uuidv4(),
        boardType,
        period,
        periodKey,
        userId: item.userId,
        rank: index + 1,
        score: item.totalPoints,
        metadataJson: {
          currentStreakDays: item.currentStreakDays,
        },
        snapshottedAt: now,
        createdBy: user.id,
      }),
    );
    if (rows.length) await this.leaderboardSnapshotRepo.save(rows);
    await this.actionLogService.create({
      entityId: user.id,
      entityType: 'LeaderboardSnapshotEntity',
      actionType: enumData.ACTION_LOG.CREATE.code,
      createdBy: user.id,
      actorCode: user.username || user.email || user.id,
      actorName: user.fullName || user.name || user.username || user.email || 'Admin',
      description: 'Rebuild leaderboard snapshots',
      dataBefore: '{}',
      dataAfter: JSON.stringify({ count: rows.length }),
    });
    return { message: this.i18n.commonTranslate('save_success'), data: transformKeys(rows) };
  }
}
