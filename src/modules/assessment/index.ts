import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import {
  AnswerEvaluationRepo,
  AssessmentAttemptRepo,
  AssessmentItemRepo,
  AssessmentRepo,
  AssessmentSectionRepo,
  AttemptAnswerRepo,
  AttemptQuestionRepo,
  ExamStructureRepo,
  ExamTypeRepo,
  QuestionOptionRepo,
  QuestionRepo,
  RubricRepo,
  UserErrorItemRepo,
} from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { NotificationModule } from '../notification';
import { AssessmentService } from './service';

@ChildModule({
  providers: [AssessmentService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([
      AssessmentRepo,
      AssessmentSectionRepo,
      AssessmentItemRepo,
      AssessmentAttemptRepo,
      AttemptQuestionRepo,
      AttemptAnswerRepo,
      RubricRepo,
      AnswerEvaluationRepo,
      QuestionRepo,
      QuestionOptionRepo,
      ExamTypeRepo,
      ExamStructureRepo,
      UserErrorItemRepo,
    ]),
    ActionLogModule,
    NotificationModule,
  ],
  exports: [AssessmentService],
})
export class AssessmentModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
