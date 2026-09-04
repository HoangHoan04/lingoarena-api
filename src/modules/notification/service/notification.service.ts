import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DefTransaction } from '~/common/core/decorator';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { PaginationDto, UserDto } from '~/dto';
import { NotificationEntity } from '~/entities';
import { NotificationRepo, UserProfileRepo } from '~/repositories';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import { FilterNotificationDto, UpsertNotificationPreferenceDto } from '../dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepo: NotificationRepo,
    private readonly userProfileRepo: UserProfileRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  async notify(userId: string, type: string, title: string, body: string, actionUrl?: string) {
    const item = await this.notificationRepo.save(
      this.notificationRepo.create({
        id: uuidv4(),
        userId,
        type,
        title,
        body,
        actionUrl,
        createdBy: userId,
      }),
    );
    return item;
  }

  async paginationMe(body: PaginationDto<FilterNotificationDto>, user: UserDto) {
    const { skip = 0, take = 20, where = {} as FilterNotificationDto } = body;
    const whereCon: FindOptionsWhere<NotificationEntity> = {
      userId: user.id,
      isDeleted: where.isDeleted ?? false,
    };
    if (where.unreadOnly) whereCon.readAt = IsNull();
    const [data, total] = await this.notificationRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
    });
    return { data: transformKeys(data), total };
  }

  @DefTransaction()
  async markRead(id: string, user: UserDto) {
    const item = await this.notificationRepo.findOne({ where: { id, userId: user.id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.notification'));
    item.readAt = item.readAt || new Date();
    item.updatedBy = user.id;
    await this.notificationRepo.save(item);
    await this.actionLogService.create({
      entityId: id,
      entityType: 'NotificationEntity',
      actionType: enumData.ACTION_LOG.UPDATE.code,
      createdBy: user.id,
      actorCode: user.username || user.email || user.id,
      actorName: user.fullName || user.name || user.username || user.email || 'User',
      description: 'Đọc thông báo',
      dataBefore: '{}',
      dataAfter: JSON.stringify({ readAt: item.readAt }),
    });
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async getPreferences(user: UserDto) {
    const profile = await this.userProfileRepo.findOne({ where: { userId: user.id } });
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: profile?.notificationPrefsJson || {},
    };
  }

  @DefTransaction()
  async upsertPreferences(items: UpsertNotificationPreferenceDto[], user: UserDto) {
    const profile = await this.userProfileRepo.findOne({ where: { userId: user.id } });
    if (!profile) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.user'));
    const next = { ...(profile.notificationPrefsJson || {}) } as Record<string, Record<string, boolean>>;
    for (const dto of items) {
      if (!next[dto.channel]) next[dto.channel] = {};
      next[dto.channel][dto.eventType] = dto.enabled ?? true;
    }
    profile.notificationPrefsJson = next;
    profile.updatedBy = user.id;
    await this.userProfileRepo.save(profile);
    return { message: this.i18n.commonTranslate('update_success'), data: next };
  }
}
