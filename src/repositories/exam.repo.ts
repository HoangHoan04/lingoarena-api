import {
  ExamSectionEntity,
  ExamSkillEntity,
  ExamTypeEntity,
  UserLearningGoalEntity,
  UserSkillLevelEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(ExamTypeEntity)
export class ExamTypeRepo extends PrimaryRepo<ExamTypeEntity> {}

@CustomRepository(ExamSkillEntity)
export class ExamSkillRepo extends PrimaryRepo<ExamSkillEntity> {}

@CustomRepository(ExamSectionEntity)
export class ExamSectionRepo extends PrimaryRepo<ExamSectionEntity> {}

@CustomRepository(UserLearningGoalEntity)
export class UserLearningGoalRepo extends PrimaryRepo<UserLearningGoalEntity> {}

@CustomRepository(UserSkillLevelEntity)
export class UserSkillLevelRepo extends PrimaryRepo<UserSkillLevelEntity> {}
