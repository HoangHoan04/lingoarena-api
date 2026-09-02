import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ProductEntitlementEntity } from './product-entitlement.entity';
import { ProductPriceEntity } from './product-price.entity';

@Entity('products')
@Index('idx_products_code', ['code'])
@Index('idx_products_status', ['status'])
export class ProductEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã nghiệp vụ sản phẩm' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Tên sản phẩm' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ enum: enumData.PRODUCT_TYPE, description: 'Loại sản phẩm' })
  @Column({ type: 'varchar', length: 50 })
  productType: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn thumbnail' })
  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Trạng thái sản phẩm (active, draft, archived)', default: 'active' })
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @ApiProperty({ description: 'Cờ sản phẩm thanh toán định kỳ', default: false })
  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @OneToMany(() => ProductPriceEntity, price => price.product)
  prices?: ProductPriceEntity[];

  @OneToMany(() => ProductEntitlementEntity, entitlement => entitlement.product)
  entitlements?: ProductEntitlementEntity[];
}
