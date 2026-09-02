import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';

@Entity('payment_webhook_events')
@Index('idx_payment_webhooks_provider_event', ['provider', 'externalEventId'], { unique: true })
@Index('idx_payment_webhooks_status', ['status'])
export class PaymentWebhookEventEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Cổng thanh toán gửi webhook' })
  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @ApiProperty({ description: 'ID sự kiện bên phía đối tác' })
  @Column({ type: 'varchar', length: 255 })
  externalEventId: string;

  @ApiProperty({ description: 'Loại sự kiện webhook' })
  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  @ApiProperty({ description: 'Payload dữ liệu JSON nhận được' })
  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @ApiProperty({
    description: 'Trạng thái xử lý webhook (pending, processed, failed, ignored)',
    default: 'pending',
  })
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @ApiPropertyOptional({ description: 'Thông báo lỗi nếu xử lý thất bại' })
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @ApiProperty({ description: 'Thời điểm nhận webhook' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  receivedAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm xử lý xong' })
  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: Date;
}
