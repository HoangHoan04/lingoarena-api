import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { UserEntity } from './user.entity';

@Entity('user_sessions')
@Index('idx_user_sessions_user_id', ['userId'])
@Index('idx_user_sessions_token_hash', ['tokenHash'])
@Index('idx_user_sessions_expires_at', ['expiresAt'])
export class UserSessionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Giá trị băm của token' })
  @Column({ type: 'varchar', length: 255, unique: true })
  tokenHash: string;

  @ApiProperty({
    description: 'Nhóm rotation của refresh token — phát hiện tái sử dụng token đã đổi',
  })
  @Column({ type: 'uuid' })
  familyId: string;

  @ApiPropertyOptional({ description: 'Địa chỉ IP của máy khách' })
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Chuỗi nhận diện trình duyệt hoặc ứng dụng khách' })
  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Loại thiết bị' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  deviceType?: string;

  @ApiPropertyOptional({
    description: 'Thông tin thiết bị (fcmToken, platform) — thay bảng user_devices',
  })
  @Column({ type: 'jsonb', nullable: true })
  deviceInfoJson?: Record<string, unknown>;

  @ApiProperty({ description: 'Thời điểm hết hạn' })
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ApiProperty({ description: 'Cờ xác định bị thu hồi', default: false })
  @Column({ type: 'boolean', default: false })
  isRevoked: boolean;

  @ApiProperty({ description: 'Thời điểm hoạt động gần nhất' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastActivityAt: Date;

  @ManyToOne(() => UserEntity, user => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
