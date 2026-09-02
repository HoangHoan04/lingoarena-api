import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { CouponEntity } from './coupon.entity';
import { OrderEntity } from './order.entity';

@Entity('coupon_redemptions')
@Index('uq_coupon_redemptions_order', ['couponId', 'orderId'], { unique: true })
@Index('idx_coupon_redemptions_user_coupon', ['userId', 'couponId'])
export class CouponRedemptionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại mã giảm giá' })
  @Column({ type: 'uuid' })
  couponId: string;

  @ApiProperty({ description: 'Khóa ngoại người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại đơn hàng' })
  @Column({ type: 'uuid' })
  orderId: string;

  @ApiProperty({ description: 'Số tiền đã giảm' })
  @Column({ type: 'bigint' })
  discountAmount: number | string;

  @ApiProperty({ description: 'Thời điểm dùng mã' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  redeemedAt: Date;

  @ManyToOne(() => CouponEntity, coupon => coupon.redemptions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'couponId' })
  coupon?: CouponEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => OrderEntity, order => order.couponRedemptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order?: OrderEntity;
}
