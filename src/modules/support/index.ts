import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { SupportTicketMessageRepo, SupportTicketRepo, UserRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { SupportService } from './service';

@ChildModule({
  providers: [SupportService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([
      SupportTicketRepo,
      SupportTicketMessageRepo,
      UserRepo,
    ]),
    ActionLogModule,
  ],
  exports: [SupportService],
})
export class SupportModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
