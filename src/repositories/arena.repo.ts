import {
  ArenaChallengeEntity,
  ArenaMatchAnswerEntity,
  ArenaMatchEntity,
  ArenaMatchParticipantEntity,
  ArenaMatchQuestionEntity,
  ArenaQueueTicketEntity,
  ArenaRatingEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(ArenaMatchEntity)
export class ArenaMatchRepo extends PrimaryRepo<ArenaMatchEntity> {}

@CustomRepository(ArenaMatchQuestionEntity)
export class ArenaMatchQuestionRepo extends PrimaryRepo<ArenaMatchQuestionEntity> {}

@CustomRepository(ArenaMatchParticipantEntity)
export class ArenaMatchParticipantRepo extends PrimaryRepo<ArenaMatchParticipantEntity> {}

@CustomRepository(ArenaMatchAnswerEntity)
export class ArenaMatchAnswerRepo extends PrimaryRepo<ArenaMatchAnswerEntity> {}

@CustomRepository(ArenaRatingEntity)
export class ArenaRatingRepo extends PrimaryRepo<ArenaRatingEntity> {}

@CustomRepository(ArenaChallengeEntity)
export class ArenaChallengeRepo extends PrimaryRepo<ArenaChallengeEntity> {}

@CustomRepository(ArenaQueueTicketEntity)
export class ArenaQueueTicketRepo extends PrimaryRepo<ArenaQueueTicketEntity> {}
