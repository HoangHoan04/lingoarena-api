import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { AssessmentRepo, AssessmentSectionRepo, AssessmentItemRepo, AssessmentAttemptRepo, AttemptSectionRepo, AttemptQuestionRepo, AttemptAnswerRepo, AnswerEventRepo, RubricRepo, RubricCriterionRepo, GradingTaskRepo, GradingResultRepo, AiGradingLogRepo, GradingResultCriterionScoreRepo, CertificateTemplateRepo, UserCertificateRepo, QuestionRepo, QuestionVersionRepo, QuestionOptionRepo, QuestionTypeRepo, UserEntitlementRepo, UserErrorItemRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { AssessmentService } from './service';

@ChildModule({
  providers: [AssessmentService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([AssessmentRepo, AssessmentSectionRepo, AssessmentItemRepo, AssessmentAttemptRepo, AttemptSectionRepo, AttemptQuestionRepo, AttemptAnswerRepo, AnswerEventRepo, RubricRepo, RubricCriterionRepo, GradingTaskRepo, GradingResultRepo, AiGradingLogRepo, GradingResultCriterionScoreRepo, CertificateTemplateRepo, UserCertificateRepo, QuestionRepo, QuestionVersionRepo, QuestionOptionRepo, QuestionTypeRepo, UserEntitlementRepo, UserErrorItemRepo]),
    ActionLogModule,
  ],
  exports: [AssessmentService],
})
export class AssessmentModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
