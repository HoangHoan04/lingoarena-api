import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import {
  ContentReviewRepo,
  ExamSectionRepo,
  ExamSkillRepo,
  ExamTypeRepo,
  QuestionGroupRepo,
  QuestionOptionRepo,
  QuestionRepo,
  QuestionTagRepo,
  QuestionTopicRepo,
  QuestionTypeRepo,
  QuestionVersionRepo,
  TagRepo,
  TopicRepo,
} from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { QuestionService } from './service';

@ChildModule({
  providers: [QuestionService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([
      QuestionTypeRepo,
      QuestionGroupRepo,
      QuestionRepo,
      QuestionVersionRepo,
      QuestionOptionRepo,
      TopicRepo,
      QuestionTopicRepo,
      TagRepo,
      QuestionTagRepo,
      ContentReviewRepo,
      ExamTypeRepo,
      ExamSkillRepo,
      ExamSectionRepo,
    ]),
    ActionLogModule,
  ],
  exports: [QuestionService],
})
export class QuestionModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
