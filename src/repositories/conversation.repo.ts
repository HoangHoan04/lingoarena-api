import {
  AiTutorPersonaEntity,
  ConversationEntity,
  ConversationMessageEntity,
  ConversationParticipantEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(AiTutorPersonaEntity)
export class AiTutorPersonaRepo extends PrimaryRepo<AiTutorPersonaEntity> {}

@CustomRepository(ConversationEntity)
export class ConversationRepo extends PrimaryRepo<ConversationEntity> {}

@CustomRepository(ConversationParticipantEntity)
export class ConversationParticipantRepo extends PrimaryRepo<ConversationParticipantEntity> {}

@CustomRepository(ConversationMessageEntity)
export class ConversationMessageRepo extends PrimaryRepo<ConversationMessageEntity> {}
