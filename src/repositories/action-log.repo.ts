import { ActionLogEntity } from '~/entities/action-log.entity';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(ActionLogEntity)
export class ActionLogRepo extends PrimaryRepo<ActionLogEntity> {}
