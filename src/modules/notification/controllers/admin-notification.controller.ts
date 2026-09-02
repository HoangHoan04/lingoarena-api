import { UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefController } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { NotificationService } from '../service/notification.service';

@ApiBearerAuth()
@ApiTags('Admin - Notification')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('notification')
export class AdminNotificationController {
  constructor(private readonly service: NotificationService) {}
}
