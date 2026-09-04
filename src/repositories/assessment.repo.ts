import {
  AnswerEvaluationEntity,
  AssessmentAttemptEntity,
  AssessmentEntity,
  AssessmentItemEntity,
  AssessmentSectionEntity,
  AttemptAnswerEntity,
  AttemptQuestionEntity,
  RubricEntity,
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

@CustomRepository(AttemptQuestionEntity)
export class AttemptQuestionRepo extends PrimaryRepo<AttemptQuestionEntity> {}

@CustomRepository(AttemptAnswerEntity)
export class AttemptAnswerRepo extends PrimaryRepo<AttemptAnswerEntity> {}

@CustomRepository(RubricEntity)
export class RubricRepo extends PrimaryRepo<RubricEntity> {}

@CustomRepository(AnswerEvaluationEntity)
export class AnswerEvaluationRepo extends PrimaryRepo<AnswerEvaluationEntity> {}
