import {
  AchievementEntity,
  DailyChallengeEntity,
  PointLedgerEntryEntity,
  UserAchievementEntity,
  UserDailyChallengeProgressEntity,
  UserGamificationStatEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(UserGamificationStatEntity)
export class UserGamificationStatRepo extends PrimaryRepo<UserGamificationStatEntity> {}

@CustomRepository(PointLedgerEntryEntity)
export class PointLedgerEntryRepo extends PrimaryRepo<PointLedgerEntryEntity> {}

@CustomRepository(AchievementEntity)
export class AchievementRepo extends PrimaryRepo<AchievementEntity> {}

@CustomRepository(UserAchievementEntity)
export class UserAchievementRepo extends PrimaryRepo<UserAchievementEntity> {}

@CustomRepository(DailyChallengeEntity)
export class DailyChallengeRepo extends PrimaryRepo<DailyChallengeEntity> {}

@CustomRepository(UserDailyChallengeProgressEntity)
export class UserDailyChallengeProgressRepo extends PrimaryRepo<UserDailyChallengeProgressEntity> {}
