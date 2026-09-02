import {
  GrammarExampleEntity,
  GrammarStructureEntity,
  GrammarTopicEntity,
  UserGrammarMasteryEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(GrammarTopicEntity)
export class GrammarTopicRepo extends PrimaryRepo<GrammarTopicEntity> {}

@CustomRepository(GrammarStructureEntity)
export class GrammarStructureRepo extends PrimaryRepo<GrammarStructureEntity> {}

@CustomRepository(GrammarExampleEntity)
export class GrammarExampleRepo extends PrimaryRepo<GrammarExampleEntity> {}

@CustomRepository(UserGrammarMasteryEntity)
export class UserGrammarMasteryRepo extends PrimaryRepo<UserGrammarMasteryEntity> {}
