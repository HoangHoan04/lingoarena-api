import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { OrderEntity } from './order.entity';

@Entity('payment_transactions')
@Index('idx_payment_tx_provider_tx', ['provider', 'providerTransactionId'], { unique: true })
@Index('idx_payment_tx_order_id', ['orderId'])
@Index('idx_payment_tx_status', ['status'])
export class PaymentTransactionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến đơn hàng' })
  @Column({ type: 'uuid' })
  orderId: string;

  @ApiProperty({
    description: 'Cổng thanh toán (vnpay, momo, zalopay, stripe, sepay, bank_transfer)',
  })
  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @ApiPropertyOptional({ description: 'ID giao dịch bên cổng thanh toán' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  providerTransactionId?: string;

  @ApiProperty({ description: 'Loại giao dịch (payment, refund, chargeback)', default: 'payment' })
  @Column({ type: 'varchar', length: 30, default: 'payment' })
  transactionType: string;

  @ApiProperty({
    enum: enumData.PAYMENT_STATUS,
    default: enumData.PAYMENT_STATUS.PENDING.code,
    description: 'Trạng thái thanh toán',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.PAYMENT_STATUS.PENDING.code })
  status: string;

  @ApiProperty({ description: 'Số tiền thanh toán' })
  @Column({ type: 'bigint' })
  amount: number | string;

  @ApiProperty({ description: 'Mã tiền tệ', default: 'VND' })
  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @ApiPropertyOptional({ description: 'Phương thức thanh toán cụ thể' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethodType?: string;

  @ApiPropertyOptional({ description: 'Payload phản hồi từ cổng thanh toán JSON' })
  @Column({ type: 'jsonb', nullable: true })
  providerPayload?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Idempotency key tránh trùng lặp' })
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Thời điểm xử lý giao dịch' })
  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @ManyToOne(() => OrderEntity, order => order.transactions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderId' })
  order?: OrderEntity;
}
