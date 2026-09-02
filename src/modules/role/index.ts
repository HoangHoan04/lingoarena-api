import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { RoleRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { RoleService } from './role.service';

@ChildModule({
  providers: [RoleService],
  controllers: [],
  imports: [TypeOrmExModule.forCustomRepository([RoleRepo]), ActionLogModule],
  exports: [RoleService],
})
export class RoleModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
