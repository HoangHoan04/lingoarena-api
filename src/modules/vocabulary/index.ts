import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { VocabularyCollocationRepo, VocabularyDeckItemRepo, VocabularyDeckRepo, VocabularyExamTypeRepo, VocabularyExampleRepo, VocabularyRelationRepo, VocabularyRepo, VocabularyReviewLogRepo, VocabularyReviewSessionRepo, VocabularyTopicRepo, UserVocabularyStateRepo, TopicRepo, ExamTypeRepo, MediaAssetRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { UploadFileModule } from '../upload-file';
import { VocabularyService } from './service';

@ChildModule({
  providers: [VocabularyService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([
      VocabularyRepo,
      VocabularyExampleRepo,
      VocabularyCollocationRepo,
      VocabularyRelationRepo,
      VocabularyTopicRepo,
      VocabularyExamTypeRepo,
      VocabularyDeckRepo,
      VocabularyDeckItemRepo,
      UserVocabularyStateRepo,
      VocabularyReviewLogRepo,
      VocabularyReviewSessionRepo,
      TopicRepo,
      ExamTypeRepo,
      MediaAssetRepo,
    ]),
    ActionLogModule,
    UploadFileModule,
  ],
  exports: [VocabularyService],
})
export class VocabularyModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
