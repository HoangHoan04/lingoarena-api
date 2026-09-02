import { LeaderboardSnapshotEntity } from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(LeaderboardSnapshotEntity)
export class LeaderboardSnapshotRepo extends PrimaryRepo<LeaderboardSnapshotEntity> {}
