import { ContactSubmissionEntity, SupportTicketEntity, SupportTicketMessageEntity } from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(SupportTicketEntity)
export class SupportTicketRepo extends PrimaryRepo<SupportTicketEntity> {}

@CustomRepository(SupportTicketMessageEntity)
export class SupportTicketMessageRepo extends PrimaryRepo<SupportTicketMessageEntity> {}

@CustomRepository(ContactSubmissionEntity)
export class ContactSubmissionRepo extends PrimaryRepo<ContactSubmissionEntity> {}
