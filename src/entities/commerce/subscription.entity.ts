import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { ProductEntity } from './product.entity';

@Entity('subscriptions')
@Index('idx_subscriptions_user_id', ['userId'])
@Index('idx_subscriptions_status', ['status'])
@Index('idx_subscriptions_period_end', ['currentPeriodEnd'])
export class SubscriptionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến sản phẩm' })
  @Column({ type: 'uuid' })
  productId: string;

  @ApiProperty({
    enum: enumData.SUBSCRIPTION_STATUS,
    default: enumData.SUBSCRIPTION_STATUS.ACTIVE.code,
    description: 'Trạng thái gói đăng ký',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.SUBSCRIPTION_STATUS.ACTIVE.code })
  status: string;

  @ApiPropertyOptional({ description: 'ID gói đăng ký bên phía cổng thanh toán' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  providerSubscriptionId?: string;

  @ApiProperty({ description: 'Thời điểm bắt đầu kỳ hiện tại' })
  @Column({ type: 'timestamptz' })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Thời điểm kết thúc kỳ hiện tại' })
  @Column({ type: 'timestamptz' })
  currentPeriodEnd: Date;

  @ApiProperty({ description: 'Cờ hủy gia hạn vào cuối kỳ', default: false })
  @Column({ type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean;

  @ApiPropertyOptional({ description: 'Thời điểm hủy' })
  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm kết thúc dùng thử' })
  @Column({ type: 'timestamptz', nullable: true })
  trialEnd?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => ProductEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product?: ProductEntity;
}
