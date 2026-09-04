import { NotificationEntity } from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(NotificationEntity)
export class NotificationRepo extends PrimaryRepo<NotificationEntity> {}
