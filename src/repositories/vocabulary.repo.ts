import {
  VocabularyDeckEntity,
  VocabularyDeckItemEntity,
  VocabularyEntity,
  VocabularyRelationEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(VocabularyEntity)
export class VocabularyRepo extends PrimaryRepo<VocabularyEntity> {}

@CustomRepository(VocabularyRelationEntity)
export class VocabularyRelationRepo extends PrimaryRepo<VocabularyRelationEntity> {}

@CustomRepository(VocabularyDeckEntity)
export class VocabularyDeckRepo extends PrimaryRepo<VocabularyDeckEntity> {}

@CustomRepository(VocabularyDeckItemEntity)
export class VocabularyDeckItemRepo extends PrimaryRepo<VocabularyDeckItemEntity> {}
