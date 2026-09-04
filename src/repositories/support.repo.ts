import { SupportTicketEntity, SupportTicketMessageEntity } from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(SupportTicketEntity)
export class SupportTicketRepo extends PrimaryRepo<SupportTicketEntity> {}

@CustomRepository(SupportTicketMessageEntity)
export class SupportTicketMessageRepo extends PrimaryRepo<SupportTicketMessageEntity> {}
