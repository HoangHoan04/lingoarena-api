import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { SupportTicketEntity } from './support-ticket.entity';

@Entity('support_ticket_messages')
@Index('idx_support_ticket_messages_ticket_id', ['ticketId'])
@Index('idx_support_ticket_messages_created_at', ['createdAt'])
export class SupportTicketMessageEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phiếu hỗ trợ' })
  @Column({ type: 'uuid' })
  ticketId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người gửi tin nhắn' })
  @Column({ type: 'uuid' })
  senderId: string;

  @ApiProperty({ description: 'Nội dung tin nhắn' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ description: 'Cờ ghi chú nội bộ (chỉ nhân viên thấy)', default: false })
  @Column({ type: 'boolean', default: false })
  isInternal: boolean;

  @ManyToOne(() => SupportTicketEntity, ticket => ticket.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket?: SupportTicketEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'senderId' })
  sender?: UserEntity;
}
