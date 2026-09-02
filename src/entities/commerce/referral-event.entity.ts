import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { OrderEntity } from './order.entity';
import { ReferralCodeEntity } from './referral-code.entity';

@Entity('referral_events')
@Index('idx_referral_events_code_id', ['referralCodeId'])
@Index('idx_referral_events_referred_user', ['referredUserId'], { unique: true })
export class ReferralEventEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến mã giới thiệu' })
  @Column({ type: 'uuid' })
  referralCodeId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng được giới thiệu' })
  @Column({ type: 'uuid', unique: true })
  referredUserId: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến đơn hàng phát sinh hoa hồng' })
  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @ApiPropertyOptional({ description: 'Số tiền hoa hồng', default: 0 })
  @Column({ type: 'bigint', default: 0 })
  commissionAmount?: number | string;

  @ApiPropertyOptional({
    description: 'Trạng thái hoa hồng (pending, approved, paid, rejected)',
    default: 'pending',
  })
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status?: string;

  @ManyToOne(() => ReferralCodeEntity, rc => rc.events, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'referralCodeId' })
  referralCode?: ReferralCodeEntity;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referredUserId' })
  referredUser?: UserEntity;

  @ManyToOne(() => OrderEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'orderId' })
  order?: OrderEntity;
}
