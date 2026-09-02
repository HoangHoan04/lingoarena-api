import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { SupportTicketMessageEntity } from './support-ticket-message.entity';

@Entity('support_tickets')
@Index('idx_support_tickets_number', ['ticketNumber'], { unique: true })
@Index('idx_support_tickets_user_id', ['userId'])
@Index('idx_support_tickets_status', ['status'])
@Index('idx_support_tickets_assigned_to', ['assignedToUserId'])
export class SupportTicketEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã số phiếu hỗ trợ' })
  @Column({ type: 'varchar', length: 50, unique: true })
  ticketNumber: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng tạo phiếu' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Danh mục hỗ trợ (billing, bug_report, question_issue, account)' })
  @Column({ type: 'varchar', length: 50 })
  category: string;

  @ApiProperty({ description: 'Tiêu đề phiếu hỗ trợ' })
  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @ApiProperty({
    enum: enumData.TICKET_PRIORITY,
    default: enumData.TICKET_PRIORITY.MEDIUM.code,
    description: 'Độ ưu tiên',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.TICKET_PRIORITY.MEDIUM.code })
  priority: string;

  @ApiProperty({
    enum: enumData.TICKET_STATUS,
    default: enumData.TICKET_STATUS.OPEN.code,
    description: 'Trạng thái phiếu hỗ trợ',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.TICKET_STATUS.OPEN.code })
  status: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến nhân viên hỗ trợ phụ trách' })
  @Column({ type: 'uuid', nullable: true })
  assignedToUserId?: string;

  @ApiPropertyOptional({ description: 'Thời điểm giải quyết phiếu' })
  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedStaff?: UserEntity;

  @OneToMany(() => SupportTicketMessageEntity, message => message.ticket)
  messages?: SupportTicketMessageEntity[];
}
