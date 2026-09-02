import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { ClassroomRepo, ClassroomMemberRepo, AssignmentRepo, AssignmentSubmissionRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { ClassroomService } from './service';

@ChildModule({
  providers: [ClassroomService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([ClassroomRepo, ClassroomMemberRepo, AssignmentRepo, AssignmentSubmissionRepo]),
    ActionLogModule,
  ],
  exports: [ClassroomService],
})
export class ClassroomModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
