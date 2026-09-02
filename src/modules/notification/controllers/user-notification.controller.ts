import { ApiTags } from '@nestjs/swagger';
import { DefController } from '~/common/core/decorator';
import { NotificationService } from '../service/notification.service';

@ApiTags('User - Notification')
@DefController('notification')
export class UserNotificationController {
  constructor(private readonly service: NotificationService) {}
}
