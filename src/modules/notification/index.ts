import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { NotificationRepo, NotificationPreferenceRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { NotificationService } from './service';

@ChildModule({
  providers: [NotificationService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([NotificationRepo, NotificationPreferenceRepo]),
    ActionLogModule,
  ],
  exports: [NotificationService],
})
export class NotificationModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
