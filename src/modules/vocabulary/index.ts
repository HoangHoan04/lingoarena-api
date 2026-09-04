import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import {
  ContentTaxonomyRepo,
  ExamTypeRepo,
  MediaAssetRepo,
  StudySessionItemRepo,
  StudySessionRepo,
  TaxonomyRepo,
  UserVocabularyStateRepo,
  VocabularyDeckItemRepo,
  VocabularyDeckRepo,
  VocabularyRelationRepo,
  VocabularyRepo,
} from '~/repositories';
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
      VocabularyRelationRepo,
      VocabularyDeckRepo,
      VocabularyDeckItemRepo,
      UserVocabularyStateRepo,
      StudySessionRepo,
      StudySessionItemRepo,
      ExamTypeRepo,
      MediaAssetRepo,
      ContentTaxonomyRepo,
      TaxonomyRepo,
    ]),
    ActionLogModule,
    UploadFileModule,
  ],
  exports: [VocabularyService],
})
export class VocabularyModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
