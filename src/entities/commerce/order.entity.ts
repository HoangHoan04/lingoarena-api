import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { CouponEntity } from './coupon.entity';
import { CouponRedemptionEntity } from './coupon-redemption.entity';
import { InvoiceEntity } from './invoice.entity';
import { OrderItemEntity } from './order-item.entity';
import { PaymentTransactionEntity } from './payment-transaction.entity';

@Entity('orders')
@Index('idx_orders_order_number', ['orderNumber'], { unique: true })
@Index('idx_orders_user_id', ['userId'])
@Index('idx_orders_status', ['status'])
@Index('idx_orders_created_at', ['createdAt'])
export class OrderEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã số đơn hàng' })
  @Column({ type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    enum: enumData.ORDER_STATUS,
    default: enumData.ORDER_STATUS.PENDING.code,
    description: 'Trạng thái đơn hàng',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ORDER_STATUS.PENDING.code })
  status: string;

  @ApiProperty({ description: 'Mã tiền tệ', default: 'VND' })
  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @ApiProperty({ description: 'Tạm tính' })
  @Column({ type: 'bigint' })
  subtotalAmount: number | string;

  @ApiProperty({ description: 'Số tiền giảm giá', default: 0 })
  @Column({ type: 'bigint', default: 0 })
  discountAmount: number | string;

  @ApiProperty({ description: 'Thuế', default: 0 })
  @Column({ type: 'bigint', default: 0 })
  taxAmount: number | string;

  @ApiProperty({ description: 'Tổng tiền thanh toán' })
  @Column({ type: 'bigint' })
  totalAmount: number | string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến mã giảm giá' })
  @Column({ type: 'uuid', nullable: true })
  couponId?: string;

  @ApiProperty({ description: 'Thời điểm đặt hàng' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  placedAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm thanh toán thành công' })
  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm hủy đơn' })
  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => CouponEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'couponId' })
  coupon?: CouponEntity;

  @OneToMany(() => OrderItemEntity, item => item.order)
  items?: OrderItemEntity[];

  @OneToMany(() => PaymentTransactionEntity, tx => tx.order)
  transactions?: PaymentTransactionEntity[];

  @OneToMany(() => CouponRedemptionEntity, redemption => redemption.order)
  couponRedemptions?: CouponRedemptionEntity[];

  @OneToMany(() => InvoiceEntity, invoice => invoice.order)
  invoices?: InvoiceEntity[];
}
