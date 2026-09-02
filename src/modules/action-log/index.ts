import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { ActionLogRepo, UserRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogService } from './action-log.service';

@ChildModule({
  providers: [ActionLogService],
  exports: [ActionLogService],
  controllers: [],
  imports: [TypeOrmExModule.forCustomRepository([ActionLogRepo, UserRepo])],
})
export class ActionLogModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
