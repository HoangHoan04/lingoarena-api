import { Injectable } from '@nestjs/common';
import { SupportTicketRepo, SupportTicketMessageRepo } from '~/repositories';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';

@Injectable()
export class SupportService {
  constructor(
    private readonly supportTicketRepo: SupportTicketRepo,
    private readonly supportTicketMessageRepo: SupportTicketMessageRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}
}
