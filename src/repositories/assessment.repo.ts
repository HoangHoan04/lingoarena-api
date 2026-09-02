import {
  AiGradingLogEntity,
  AnswerEventEntity,
  AssessmentAttemptEntity,
  AssessmentEntity,
  AssessmentItemEntity,
  AssessmentSectionEntity,
  AttemptAnswerEntity,
  AttemptQuestionEntity,
  AttemptSectionEntity,
  CertificateTemplateEntity,
  GradingResultCriterionScoreEntity,
  GradingResultEntity,
  GradingTaskEntity,
  RubricCriterionEntity,
  RubricEntity,
  UserCertificateEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(AssessmentEntity)
export class AssessmentRepo extends PrimaryRepo<AssessmentEntity> {}

@CustomRepository(AssessmentSectionEntity)
export class AssessmentSectionRepo extends PrimaryRepo<AssessmentSectionEntity> {}

@CustomRepository(AssessmentItemEntity)
export class AssessmentItemRepo extends PrimaryRepo<AssessmentItemEntity> {}

@CustomRepository(AssessmentAttemptEntity)
export class AssessmentAttemptRepo extends PrimaryRepo<AssessmentAttemptEntity> {}

@CustomRepository(AttemptSectionEntity)
export class AttemptSectionRepo extends PrimaryRepo<AttemptSectionEntity> {}

@CustomRepository(AttemptQuestionEntity)
export class AttemptQuestionRepo extends PrimaryRepo<AttemptQuestionEntity> {}

@CustomRepository(AttemptAnswerEntity)
export class AttemptAnswerRepo extends PrimaryRepo<AttemptAnswerEntity> {}

@CustomRepository(AnswerEventEntity)
export class AnswerEventRepo extends PrimaryRepo<AnswerEventEntity> {}

@CustomRepository(RubricEntity)
export class RubricRepo extends PrimaryRepo<RubricEntity> {}

@CustomRepository(RubricCriterionEntity)
export class RubricCriterionRepo extends PrimaryRepo<RubricCriterionEntity> {}

@CustomRepository(GradingTaskEntity)
export class GradingTaskRepo extends PrimaryRepo<GradingTaskEntity> {}

@CustomRepository(GradingResultEntity)
export class GradingResultRepo extends PrimaryRepo<GradingResultEntity> {}

@CustomRepository(AiGradingLogEntity)
export class AiGradingLogRepo extends PrimaryRepo<AiGradingLogEntity> {}

@CustomRepository(GradingResultCriterionScoreEntity)
export class GradingResultCriterionScoreRepo extends PrimaryRepo<GradingResultCriterionScoreEntity> {}

@CustomRepository(CertificateTemplateEntity)
export class CertificateTemplateRepo extends PrimaryRepo<CertificateTemplateEntity> {}

@CustomRepository(UserCertificateEntity)
export class UserCertificateRepo extends PrimaryRepo<UserCertificateEntity> {}
