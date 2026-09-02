import {
  LearningPathEntity,
  LearningPathItemEntity,
  MasteryRecordEntity,
  UserDailyActivityEntity,
  UserErrorItemEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(LearningPathEntity)
export class LearningPathRepo extends PrimaryRepo<LearningPathEntity> {}

@CustomRepository(LearningPathItemEntity)
export class LearningPathItemRepo extends PrimaryRepo<LearningPathItemEntity> {}

@CustomRepository(MasteryRecordEntity)
export class MasteryRecordRepo extends PrimaryRepo<MasteryRecordEntity> {}

@CustomRepository(UserErrorItemEntity)
export class UserErrorItemRepo extends PrimaryRepo<UserErrorItemEntity> {}

@CustomRepository(UserDailyActivityEntity)
export class UserDailyActivityRepo extends PrimaryRepo<UserDailyActivityEntity> {}
