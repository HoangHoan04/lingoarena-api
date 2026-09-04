import { GrammarStructureEntity, GrammarTopicEntity } from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(GrammarTopicEntity)
export class GrammarTopicRepo extends PrimaryRepo<GrammarTopicEntity> {}

@CustomRepository(GrammarStructureEntity)
export class GrammarStructureRepo extends PrimaryRepo<GrammarStructureEntity> {}
