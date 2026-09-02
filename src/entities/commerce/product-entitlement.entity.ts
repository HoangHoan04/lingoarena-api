import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ProductEntity } from './product.entity';

@Entity('product_entitlements')
@Index('idx_product_entitlements_product_id', ['productId'])
export class ProductEntitlementEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến sản phẩm' })
  @Column({ type: 'uuid' })
  productId: string;

  @ApiProperty({ enum: enumData.ENTITLEMENT_RESOURCE_TYPE, description: 'Loại tài nguyên được mở' })
  @Column({ type: 'varchar', length: 50 })
  resourceType: string;

  @ApiPropertyOptional({ description: 'ID tài nguyên cụ thể (null = toàn cầu)' })
  @Column({ type: 'uuid', nullable: true })
  resourceId?: string;

  @ApiProperty({
    enum: enumData.ACCESS_LEVEL,
    default: enumData.ACCESS_LEVEL.FULL.code,
    description: 'Mức độ truy cập',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.ACCESS_LEVEL.FULL.code })
  accessLevel: string;

  @ApiPropertyOptional({ description: 'Hạn mức sử dụng (0 = không giới hạn)', default: 0 })
  @Column({ type: 'int', default: 0 })
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Thời hạn số ngày (0 = theo gói đăng ký)', default: 0 })
  @Column({ type: 'int', default: 0 })
  durationDays?: number;

  @ManyToOne(() => ProductEntity, product => product.entitlements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product?: ProductEntity;
}
