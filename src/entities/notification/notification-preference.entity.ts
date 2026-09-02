import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';

@Entity('notification_preferences')
@Index('idx_notif_prefs_pk', ['userId', 'channel', 'eventType'], { unique: true })
export class NotificationPreferenceEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Kênh nhận thông báo (in_app, email, push, sms)' })
  @Column({ type: 'varchar', length: 20 })
  channel: string;

  @ApiProperty({ description: 'Loại sự kiện thông báo' })
  @Column({ type: 'varchar', length: 50 })
  eventType: string;

  @ApiProperty({ description: 'Cờ bật/tắt nhận thông báo', default: true })
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
