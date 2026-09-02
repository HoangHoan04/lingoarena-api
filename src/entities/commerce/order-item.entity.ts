import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { OrderEntity } from './order.entity';
import { ProductPriceEntity } from './product-price.entity';
import { ProductEntity } from './product.entity';

@Entity('order_items')
@Index('idx_order_items_order_id', ['orderId'])
@Index('idx_order_items_product_id', ['productId'])
export class OrderItemEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến đơn hàng' })
  @Column({ type: 'uuid' })
  orderId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến sản phẩm' })
  @Column({ type: 'uuid' })
  productId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến mức giá' })
  @Column({ type: 'uuid' })
  priceId: string;

  @ApiProperty({ description: 'Snapshot chi tiết sản phẩm lúc thanh toán JSON' })
  @Column({ type: 'jsonb' })
  productSnapshotJson: Record<string, unknown>;

  @ApiProperty({ description: 'Số lượng mua', default: 1 })
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ApiProperty({ description: 'Đơn giá' })
  @Column({ type: 'bigint' })
  unitAmount: number | string;

  @ApiProperty({ description: 'Số tiền chiết khấu', default: 0 })
  @Column({ type: 'bigint', default: 0 })
  discountAmount: number | string;

  @ApiProperty({ description: 'Tổng số tiền dòng hàng' })
  @Column({ type: 'bigint' })
  totalAmount: number | string;

  @ManyToOne(() => OrderEntity, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order?: OrderEntity;

  @ManyToOne(() => ProductEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product?: ProductEntity;

  @ManyToOne(() => ProductPriceEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'priceId' })
  price?: ProductPriceEntity;
}
