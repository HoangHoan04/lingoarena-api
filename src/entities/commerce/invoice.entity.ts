import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { MediaAssetEntity } from '../media/media-asset.entity';
import { OrderEntity } from './order.entity';

@Entity('invoices')
@Index('idx_invoices_number', ['invoiceNumber'], { unique: true })
@Index('idx_invoices_order_id', ['orderId'])
@Index('idx_invoices_user_id', ['userId'])
export class InvoiceEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Số hóa đơn' })
  @Column({ type: 'varchar', length: 50, unique: true })
  invoiceNumber: string;

  @ApiProperty({ description: 'Khóa ngoại đơn hàng' })
  @Column({ type: 'uuid' })
  orderId: string;

  @ApiProperty({ description: 'Khóa ngoại người mua' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    enum: enumData.INVOICE_STATUS,
    default: enumData.INVOICE_STATUS.DRAFT.code,
    description: 'Trạng thái hóa đơn',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.INVOICE_STATUS.DRAFT.code })
  status: string;

  @ApiProperty({ description: 'Tên người mua / công ty' })
  @Column({ type: 'varchar', length: 255 })
  buyerName: string;

  @ApiPropertyOptional({ description: 'Mã số thuế' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  buyerTaxCode?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ xuất hóa đơn' })
  @Column({ type: 'text', nullable: true })
  buyerAddress?: string;

  @ApiProperty({ description: 'Tiền tệ', default: 'VND' })
  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @ApiProperty({ description: 'Tạm tính' })
  @Column({ type: 'bigint' })
  subtotalAmount: number | string;

  @ApiProperty({ description: 'Thuế', default: 0 })
  @Column({ type: 'bigint', default: 0 })
  taxAmount: number | string;

  @ApiProperty({ description: 'Tổng thanh toán' })
  @Column({ type: 'bigint' })
  totalAmount: number | string;

  @ApiPropertyOptional({ description: 'File PDF hóa đơn' })
  @Column({ type: 'uuid', nullable: true })
  pdfAssetId?: string;

  @ApiPropertyOptional({ description: 'Thời điểm phát hành' })
  @Column({ type: 'timestamptz', nullable: true })
  issuedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm thanh toán' })
  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @ManyToOne(() => OrderEntity, order => order.invoices, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderId' })
  order?: OrderEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pdfAssetId' })
  pdfAsset?: MediaAssetEntity;
}
