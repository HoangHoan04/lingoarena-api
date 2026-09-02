import {
  UserVocabularyStateEntity,
  VocabularyCollocationEntity,
  VocabularyDeckEntity,
  VocabularyDeckItemEntity,
  VocabularyEntity,
  VocabularyExamTypeEntity,
  VocabularyExampleEntity,
  VocabularyRelationEntity,
  VocabularyReviewLogEntity,
  VocabularyReviewSessionEntity,
  VocabularyTopicEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(VocabularyEntity)
export class VocabularyRepo extends PrimaryRepo<VocabularyEntity> {}

@CustomRepository(VocabularyExampleEntity)
export class VocabularyExampleRepo extends PrimaryRepo<VocabularyExampleEntity> {}

@CustomRepository(VocabularyCollocationEntity)
export class VocabularyCollocationRepo extends PrimaryRepo<VocabularyCollocationEntity> {}

@CustomRepository(VocabularyRelationEntity)
export class VocabularyRelationRepo extends PrimaryRepo<VocabularyRelationEntity> {}

@CustomRepository(VocabularyTopicEntity)
export class VocabularyTopicRepo extends PrimaryRepo<VocabularyTopicEntity> {}

@CustomRepository(VocabularyExamTypeEntity)
export class VocabularyExamTypeRepo extends PrimaryRepo<VocabularyExamTypeEntity> {}

@CustomRepository(VocabularyDeckEntity)
export class VocabularyDeckRepo extends PrimaryRepo<VocabularyDeckEntity> {}

@CustomRepository(VocabularyDeckItemEntity)
export class VocabularyDeckItemRepo extends PrimaryRepo<VocabularyDeckItemEntity> {}

@CustomRepository(UserVocabularyStateEntity)
export class UserVocabularyStateRepo extends PrimaryRepo<UserVocabularyStateEntity> {}

@CustomRepository(VocabularyReviewLogEntity)
export class VocabularyReviewLogRepo extends PrimaryRepo<VocabularyReviewLogEntity> {}

@CustomRepository(VocabularyReviewSessionEntity)
export class VocabularyReviewSessionRepo extends PrimaryRepo<VocabularyReviewSessionEntity> {}
