import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';

@Entity('notifications')
@Index('idx_notifications_user_read_created', ['userId', 'readAt', 'createdAt'])
@Index('idx_notifications_user_id', ['userId'])
export class NotificationEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng nhận thông báo' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    description: 'Loại thông báo (streak_reminder, grading_ready, payment_success, assignment_due)',
  })
  @Column({ type: 'varchar', length: 50 })
  type: string;

  @ApiProperty({ description: 'Tiêu đề thông báo' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Nội dung thông báo' })
  @Column({ type: 'text' })
  body: string;

  @ApiPropertyOptional({ description: 'Đường dẫn liên kết hành động' })
  @Column({ type: 'text', nullable: true })
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu thông báo JSON bổ sung' })
  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Thời điểm đọc thông báo' })
  @Column({ type: 'timestamptz', nullable: true })
  readAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
