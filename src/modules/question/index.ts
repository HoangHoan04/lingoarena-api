import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import {
  ContentSegmentRepo,
  ContentTaxonomyRepo,
  ExamStructureRepo,
  ExamTypeRepo,
  QuestionGroupRepo,
  QuestionOptionRepo,
  QuestionRepo,
  StudySessionItemRepo,
  StudySessionRepo,
  TaxonomyRepo,
} from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { QuestionService, YoutubeTranscriptService } from './service';

@ChildModule({
  providers: [QuestionService, YoutubeTranscriptService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([
      QuestionGroupRepo,
      ContentSegmentRepo,
      QuestionRepo,
      QuestionOptionRepo,
      TaxonomyRepo,
      ContentTaxonomyRepo,
      ExamTypeRepo,
      ExamStructureRepo,
      StudySessionRepo,
      StudySessionItemRepo,
    ]),
    ActionLogModule,
  ],
  exports: [QuestionService, YoutubeTranscriptService],
})
export class QuestionModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
