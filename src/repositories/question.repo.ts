import {
  ContentSegmentEntity,
  QuestionEntity,
  QuestionGroupEntity,
  QuestionOptionEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(QuestionGroupEntity)
export class QuestionGroupRepo extends PrimaryRepo<QuestionGroupEntity> {}

@CustomRepository(ContentSegmentEntity)
export class ContentSegmentRepo extends PrimaryRepo<ContentSegmentEntity> {}

@CustomRepository(QuestionEntity)
export class QuestionRepo extends PrimaryRepo<QuestionEntity> {}

@CustomRepository(QuestionOptionEntity)
export class QuestionOptionRepo extends PrimaryRepo<QuestionOptionEntity> {}
