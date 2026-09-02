import { Injectable } from '@nestjs/common';
import { NotificationRepo, NotificationPreferenceRepo } from '~/repositories';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepo: NotificationRepo,
    private readonly notificationPreferenceRepo: NotificationPreferenceRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}
}
