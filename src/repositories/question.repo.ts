import {
  ContentReviewEntity,
  QuestionEntity,
  QuestionGroupEntity,
  QuestionOptionEntity,
  QuestionTagEntity,
  QuestionTopicEntity,
  QuestionTypeEntity,
  QuestionVersionEntity,
  TagEntity,
  TopicEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(QuestionTypeEntity)
export class QuestionTypeRepo extends PrimaryRepo<QuestionTypeEntity> {}

@CustomRepository(QuestionGroupEntity)
export class QuestionGroupRepo extends PrimaryRepo<QuestionGroupEntity> {}

@CustomRepository(QuestionEntity)
export class QuestionRepo extends PrimaryRepo<QuestionEntity> {}

@CustomRepository(QuestionVersionEntity)
export class QuestionVersionRepo extends PrimaryRepo<QuestionVersionEntity> {}

@CustomRepository(QuestionOptionEntity)
export class QuestionOptionRepo extends PrimaryRepo<QuestionOptionEntity> {}

@CustomRepository(TopicEntity)
export class TopicRepo extends PrimaryRepo<TopicEntity> {}

@CustomRepository(QuestionTopicEntity)
export class QuestionTopicRepo extends PrimaryRepo<QuestionTopicEntity> {}

@CustomRepository(TagEntity)
export class TagRepo extends PrimaryRepo<TagEntity> {}

@CustomRepository(QuestionTagEntity)
export class QuestionTagRepo extends PrimaryRepo<QuestionTagEntity> {}

@CustomRepository(ContentReviewEntity)
export class ContentReviewRepo extends PrimaryRepo<ContentReviewEntity> {}
