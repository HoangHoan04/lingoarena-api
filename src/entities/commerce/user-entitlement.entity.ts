import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';

@Entity('user_entitlements')
@Index('idx_user_entitlements_lookup', [
  'userId',
  'resourceType',
  'resourceId',
  'status',
  'expiresAt',
])
@Index('idx_user_entitlements_user_id', ['userId'])
@Index('idx_user_entitlements_status', ['status'])
export class UserEntitlementEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: enumData.ENTITLEMENT_RESOURCE_TYPE, description: 'Loại tài nguyên được cấp' })
  @Column({ type: 'varchar', length: 50 })
  resourceType: string;

  @ApiPropertyOptional({ description: 'ID tài nguyên được cấp quyền' })
  @Column({ type: 'uuid', nullable: true })
  resourceId?: string;

  @ApiProperty({
    enum: enumData.ACCESS_LEVEL,
    default: enumData.ACCESS_LEVEL.FULL.code,
    description: 'Mức độ truy cập',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.ACCESS_LEVEL.FULL.code })
  accessLevel: string;

  @ApiProperty({ enum: enumData.ENTITLEMENT_SOURCE_TYPE, description: 'Nguồn cấp quyền' })
  @Column({ type: 'varchar', length: 50 })
  sourceType: string;

  @ApiPropertyOptional({ description: 'ID nguồn (Order ID hoặc Subscription ID)' })
  @Column({ type: 'uuid', nullable: true })
  sourceId?: string;

  @ApiPropertyOptional({ description: 'Hạn mức sử dụng (0 = không giới hạn)', default: 0 })
  @Column({ type: 'int', default: 0 })
  usageLimit?: number;

  @ApiProperty({ description: 'Số lần đã dùng', default: 0 })
  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @ApiProperty({ description: 'Thời điểm bắt đầu có hiệu lực' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  startsAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm hết hiệu lực' })
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @ApiProperty({
    enum: enumData.ENTITLEMENT_STATUS,
    default: enumData.ENTITLEMENT_STATUS.ACTIVE.code,
    description: 'Trạng thái quyền lợi',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ENTITLEMENT_STATUS.ACTIVE.code })
  status: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
