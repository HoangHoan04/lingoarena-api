import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { OrganizationMemberRepo, OrganizationRepo, RoleRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { OrganizationService } from './service';

@ChildModule({
  providers: [OrganizationService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([OrganizationRepo, OrganizationMemberRepo, RoleRepo]),
    ActionLogModule,
  ],
  exports: [OrganizationService],
})
export class OrganizationModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
