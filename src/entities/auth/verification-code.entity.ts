import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { UserEntity } from './user.entity';

@Entity('verification_codes')
@Index('idx_verification_codes_user_purpose', ['userId', 'purpose'])
@Index('idx_verification_codes_expires_at', ['expiresAt'])
export class VerificationCodeEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @ApiProperty({ enum: enumData.OTP_PURPOSE, description: 'Mục đích mã OTP' })
  @Column({ type: 'varchar', length: 20 })
  purpose: string;

  @ApiProperty({ description: 'Giá trị băm của mã OTP' })
  @Column({ type: 'varchar', length: 255 })
  codeHash: string;

  @ApiProperty({ description: 'Kênh gửi mã (email, sms, zalo)' })
  @Column({ type: 'varchar', length: 20 })
  channel: string;

  @ApiProperty({ description: 'Địa chỉ email hoặc số điện thoại nhận mã' })
  @Column({ type: 'varchar', length: 255 })
  destination: string;

  @ApiProperty({ description: 'Số lần đã thử nhập', default: 0 })
  @Column({ type: 'int', default: 0 })
  attemptCount: number;

  @ApiProperty({ description: 'Số lần tối đa được thử', default: 5 })
  @Column({ type: 'int', default: 5 })
  maxAttempts: number;

  @ApiProperty({ description: 'Cờ xác định đã sử dụng', default: false })
  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @ApiPropertyOptional({ description: 'Thời điểm sử dụng' })
  @Column({ type: 'timestamptz', nullable: true })
  usedAt?: Date;

  @ApiProperty({ description: 'Thời điểm hết hiệu lực' })
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ManyToOne(() => UserEntity, user => user.verificationCodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
