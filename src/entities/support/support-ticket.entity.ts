import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { SupportTicketMessageEntity } from './support-ticket-message.entity';

/**
 * Bảng `support_tickets` — phiếu hỗ trợ (quyết định 9.3: không gộp vào conversations).
 * Có vòng đời riêng: phân công, ưu tiên, SLA, ghi chú nội bộ.
 */
@Entity('support_tickets')
@Index('uq_support_tickets_number_alive', ['ticketNumber'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class SupportTicketEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã phiếu hiển thị cho người dùng' })
  @Column({ type: 'varchar', length: 30 })
  ticketNumber: string;

  @ApiProperty({ description: 'Người mở phiếu' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: enumData.TICKET_CATEGORY, description: 'Phân loại yêu cầu' })
  @Column({ type: 'varchar', length: 50 })
  category: string;

  @ApiProperty({ description: 'Tiêu đề' })
  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @ApiPropertyOptional({ description: 'Nội dung mở đầu' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    enum: enumData.TICKET_PRIORITY,
    default: enumData.TICKET_PRIORITY.MEDIUM.code,
    description: 'Mức ưu tiên',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.TICKET_PRIORITY.MEDIUM.code })
  priority: string;

  @ApiPropertyOptional({ description: 'Nhân viên đang xử lý' })
  @Column({ type: 'uuid', nullable: true })
  assignedToUserId?: string;

  @ApiPropertyOptional({ description: 'Đơn hàng liên quan nếu ticket về thanh toán' })
  @Column({ type: 'uuid', nullable: true })
  relatedOrderId?: string;

  @ApiProperty({ description: 'Số tin nhắn — denormalize để list không phải count' })
  @Column({ type: 'int', default: 0 })
  messageCount: number;

  @ApiPropertyOptional({ description: 'Thời điểm tin nhắn gần nhất' })
  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm phản hồi đầu tiên — dùng đo SLA' })
  @Column({ type: 'timestamptz', nullable: true })
  firstRespondedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm giải quyết' })
  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm đóng phiếu' })
  @Column({ type: 'timestamptz', nullable: true })
  closedAt?: Date;

  @OneToMany(() => SupportTicketMessageEntity, message => message.ticket)
  messages?: SupportTicketMessageEntity[];
}
