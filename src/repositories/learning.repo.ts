import {
  LearningPathEntity,
  LearningPathItemEntity,
  StudySessionEntity,
  StudySessionItemEntity,
  UserDailyActivityEntity,
  UserErrorItemEntity,
  UserLearningGoalEntity,
  UserMasteryEntity,
  UserVocabularyStateEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(UserLearningGoalEntity)
export class UserLearningGoalRepo extends PrimaryRepo<UserLearningGoalEntity> {}

@CustomRepository(LearningPathEntity)
export class LearningPathRepo extends PrimaryRepo<LearningPathEntity> {}

@CustomRepository(LearningPathItemEntity)
export class LearningPathItemRepo extends PrimaryRepo<LearningPathItemEntity> {}

@CustomRepository(UserMasteryEntity)
export class UserMasteryRepo extends PrimaryRepo<UserMasteryEntity> {}

@CustomRepository(UserVocabularyStateEntity)
export class UserVocabularyStateRepo extends PrimaryRepo<UserVocabularyStateEntity> {}

@CustomRepository(StudySessionEntity)
export class StudySessionRepo extends PrimaryRepo<StudySessionEntity> {}

@CustomRepository(StudySessionItemEntity)
export class StudySessionItemRepo extends PrimaryRepo<StudySessionItemEntity> {}

@CustomRepository(UserErrorItemEntity)
export class UserErrorItemRepo extends PrimaryRepo<UserErrorItemEntity> {}

@CustomRepository(UserDailyActivityEntity)
export class UserDailyActivityRepo extends PrimaryRepo<UserDailyActivityEntity> {}
