import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { SupportTicketEntity } from './support-ticket.entity';

/**
 * Bảng `support_ticket_messages` — tin nhắn trong phiếu hỗ trợ.
 *
 * `isInternalNote = true` không được trả về API user. Đây là lý do không gộp
 * ticket vào `conversations`: mọi query phía customer phải lọc cột này.
 *
 * File kèm (N file) gắn qua `media_attachments` với ownerType = SupportTicketMessageEntity.
 */
@Entity('support_ticket_messages')
@Index('idx_support_ticket_messages_ticket', ['supportTicketId', 'sentAt'])
export class SupportTicketMessageEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phiếu hỗ trợ' })
  @Column({ type: 'uuid' })
  supportTicketId: string;

  @ApiPropertyOptional({ description: 'Người gửi. Null nếu tin hệ thống' })
  @Column({ type: 'uuid', nullable: true })
  senderUserId?: string;

  @ApiProperty({ enum: enumData.TICKET_SENDER_ROLE, description: 'Vai trò người gửi' })
  @Column({ type: 'varchar', length: 20 })
  senderRole: string;

  @ApiProperty({ description: 'Nội dung tin' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({
    description: 'Ghi chú nội bộ — không trả về API user',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  isInternalNote: boolean;

  @ApiProperty({ description: 'Thời điểm gửi' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  sentAt: Date;

  @ManyToOne(() => SupportTicketEntity, ticket => ticket.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supportTicketId' })
  ticket?: SupportTicketEntity;
}
