import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';

/**
 * Bảng `notifications` — thông báo in-app gửi tới một user.
 * Tuỳ chọn nhận thông báo nằm ở `user_profiles.notificationPrefsJson`, không tách bảng.
 */
@Entity('notifications')
@Index('idx_notifications_user_read', ['userId', 'readAt', 'createdAt'])
@Index('idx_notifications_type', ['type'])
export class NotificationEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Người nhận thông báo' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: enumData.NOTIFICATION_TYPE, description: 'Loại thông báo' })
  @Column({ type: 'varchar', length: 50 })
  type: string;

  @ApiProperty({ description: 'Tiêu đề' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Nội dung' })
  @Column({ type: 'text', nullable: true })
  body?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn khi người dùng bấm vào thông báo' })
  @Column({ type: 'text', nullable: true })
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Payload phụ để UI render' })
  @Column({ type: 'jsonb', nullable: true })
  dataJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Thời điểm đã đọc. Null = chưa đọc' })
  @Column({ type: 'timestamptz', nullable: true })
  readAt?: Date;

  @ApiProperty({ description: 'Thời điểm gửi' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  sentAt: Date;
}
