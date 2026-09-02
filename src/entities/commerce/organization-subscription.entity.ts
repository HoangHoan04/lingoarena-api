import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { OrganizationEntity } from '../auth/organization.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { SubscriptionEntity } from './subscription.entity';

@Entity('organization_subscriptions')
@Index('uq_org_subscriptions', ['organizationId', 'subscriptionId'], { unique: true })
@Index('idx_org_subscriptions_org_id', ['organizationId'])
export class OrganizationSubscriptionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tổ chức' })
  @Column({ type: 'uuid' })
  organizationId: string;

  @ApiProperty({ description: 'Khóa ngoại gói đăng ký' })
  @Column({ type: 'uuid' })
  subscriptionId: string;

  @ApiProperty({ description: 'Giới hạn ghế của gói này', default: 0 })
  @Column({ type: 'int', default: 0 })
  seatLimit: number;

  @ApiProperty({ description: 'Số ghế đã dùng', default: 0 })
  @Column({ type: 'int', default: 0 })
  seatUsed: number;

  @ApiProperty({
    enum: enumData.SUBSCRIPTION_STATUS,
    default: enumData.SUBSCRIPTION_STATUS.ACTIVE.code,
    description: 'Trạng thái gói tổ chức',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.SUBSCRIPTION_STATUS.ACTIVE.code })
  status: string;

  @ApiProperty({ description: 'Bắt đầu hiệu lực' })
  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @ApiProperty({ description: 'Hết hiệu lực' })
  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization?: OrganizationEntity;

  @ManyToOne(() => SubscriptionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription?: SubscriptionEntity;
}
