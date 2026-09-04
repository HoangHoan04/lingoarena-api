import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import {
  AssessmentRepo,
  ExamTypeRepo,
  GrammarStructureRepo,
  LessonRepo,
  LearningPathItemRepo,
  LearningPathRepo,
  UserMasteryRepo,
  UserDailyActivityRepo,
  UserErrorItemRepo,
  UserLearningGoalRepo,
  VocabularyDeckRepo,
} from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { GamificationModule } from '../gamification';
import { LearningService } from './service';

@ChildModule({
  providers: [LearningService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([
      UserLearningGoalRepo,
      ExamTypeRepo,
      VocabularyDeckRepo,
      GrammarStructureRepo,
      LessonRepo,
      AssessmentRepo,
      LearningPathRepo,
      LearningPathItemRepo,
      UserMasteryRepo,
      UserErrorItemRepo,
      UserDailyActivityRepo,
    ]),
    ActionLogModule,
    GamificationModule,
  ],
  exports: [LearningService],
})
export class LearningModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
