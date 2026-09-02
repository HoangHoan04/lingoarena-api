import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { UserRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { NotifyService } from './notify.service';

@ChildModule({
  providers: [NotifyService],
  exports: [NotifyService],
  controllers: [],
  imports: [TypeOrmExModule.forCustomRepository([UserRepo])],
})
export class NotifyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
