import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { CouponRedemptionEntity } from './coupon-redemption.entity';

@Entity('coupons')
@Index('idx_coupons_code', ['code'])
@Index('idx_coupons_is_active', ['isActive'])
export class CouponEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã giảm giá khuyến mãi' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Loại giảm giá (percentage, fixed_amount)' })
  @Column({ type: 'varchar', length: 20 })
  discountType: string;

  @ApiProperty({ description: 'Giá trị giảm (% hoặc số tiền VND)' })
  @Column({ type: 'bigint' })
  discountValue: number | string;

  @ApiPropertyOptional({ description: 'Giá trị đơn hàng tối thiểu', default: 0 })
  @Column({ type: 'bigint', default: 0 })
  minOrderAmount?: number | string;

  @ApiPropertyOptional({ description: 'Số tiền giảm tối đa' })
  @Column({ type: 'bigint', nullable: true })
  maxDiscountAmount?: number | string;

  @ApiPropertyOptional({ description: 'Số lần sử dụng tối đa (0 = không giới hạn)', default: 0 })
  @Column({ type: 'int', default: 0 })
  usageLimit?: number;

  @ApiProperty({ description: 'Số lần đã sử dụng', default: 0 })
  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @ApiPropertyOptional({ description: 'Số lần tối đa mỗi user được dùng', default: 1 })
  @Column({ type: 'int', default: 1 })
  userLimit?: number;

  @ApiProperty({ description: 'Thời điểm bắt đầu áp dụng' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  startsAt: Date;

  @ApiProperty({ description: 'Thời điểm hết hạn' })
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ApiProperty({ description: 'Trạng thái hoạt động', default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => CouponRedemptionEntity, redemption => redemption.coupon)
  redemptions?: CouponRedemptionEntity[];
}
