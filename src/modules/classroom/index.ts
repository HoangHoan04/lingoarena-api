import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import {
  AssignmentRepo,
  AssignmentSubmissionRepo,
  ClassroomMemberRepo,
  ClassroomRepo,
  MediaAttachmentRepo,
  RoleRepo,
  UserRepo,
} from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { NotificationModule } from '../notification';
import { ClassroomService } from './service';

@ChildModule({
  providers: [ClassroomService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([
      ClassroomRepo,
      ClassroomMemberRepo,
      AssignmentRepo,
      AssignmentSubmissionRepo,
      RoleRepo,
      UserRepo,
      MediaAttachmentRepo,
    ]),
    ActionLogModule,
    NotificationModule,
  ],
  exports: [ClassroomService],
})
export class ClassroomModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
