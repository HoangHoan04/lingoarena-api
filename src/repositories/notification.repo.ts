import { NotificationEntity, NotificationPreferenceEntity } from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(NotificationEntity)
export class NotificationRepo extends PrimaryRepo<NotificationEntity> {}

@CustomRepository(NotificationPreferenceEntity)
export class NotificationPreferenceRepo extends PrimaryRepo<NotificationPreferenceEntity> {}
