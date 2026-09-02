import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ProductEntity } from './product.entity';

@Entity('product_prices')
@Index('idx_product_prices_product_id', ['productId'])
@Index('idx_product_prices_is_active', ['isActive'])
export class ProductPriceEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến sản phẩm' })
  @Column({ type: 'uuid' })
  productId: string;

  @ApiProperty({ description: 'Mã loại tiền tệ', default: 'VND' })
  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @ApiProperty({ description: 'Số tiền theo đơn vị tiền tệ nhỏ nhất' })
  @Column({ type: 'bigint' })
  amount: number | string;

  @ApiPropertyOptional({ description: 'Giá gốc trước giảm' })
  @Column({ type: 'bigint', nullable: true })
  originalAmount?: number | string;

  @ApiPropertyOptional({ description: 'Kỳ thanh toán (month, quarter, year, onetime)' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  billingPeriod?: string;

  @ApiPropertyOptional({ description: 'Khoảng thời gian kỳ thanh toán', default: 1 })
  @Column({ type: 'int', default: 1 })
  billingInterval?: number;

  @ApiPropertyOptional({ description: 'Mã quốc gia', default: 'VN' })
  @Column({ type: 'varchar', length: 5, default: 'VN' })
  countryCode?: string;

  @ApiProperty({ description: 'Thời điểm bắt đầu áp dụng giá' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  startsAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm kết thúc áp dụng giá' })
  @Column({ type: 'timestamptz', nullable: true })
  endsAt?: Date;

  @ApiProperty({ description: 'Trạng thái hoạt động', default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => ProductEntity, product => product.prices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product?: ProductEntity;
}
