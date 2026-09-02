import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { UserEntity } from './user.entity';

@Entity('user_devices')
@Index('idx_user_devices_user_id', ['userId'])
@Index('idx_user_devices_device_token', ['deviceToken'])
export class UserDeviceEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Push token thiết bị (FCM/APNs)' })
  @Column({ type: 'varchar', length: 255 })
  deviceToken: string;

  @ApiProperty({ description: 'Loại thiết bị (ios, android, web)' })
  @Column({ type: 'varchar', length: 20 })
  deviceType: string;

  @ApiPropertyOptional({ description: 'Model thiết bị' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceModel?: string;

  @ApiPropertyOptional({ description: 'Phiên bản hệ điều hành' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  osVersion?: string;

  @ApiPropertyOptional({ description: 'Phiên bản ứng dụng' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  appVersion?: string;

  @ApiProperty({ description: 'Cờ trạng thái hoạt động', default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Thời điểm hoạt động cuối' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastSeenAt: Date;

  @ManyToOne(() => UserEntity, user => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
