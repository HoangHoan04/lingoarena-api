import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { ReferralEventEntity } from './referral-event.entity';

@Entity('referral_codes')
@Index('idx_referral_codes_code', ['code'], { unique: true })
export class ReferralCodeEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng sở hữu mã' })
  @Column({ type: 'uuid', unique: true })
  userId: string;

  @ApiProperty({ description: 'Mã giới thiệu duy nhất' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiPropertyOptional({
    description: 'Loại phần thưởng giới thiệu',
    default: 'commission_percent',
  })
  @Column({ type: 'varchar', length: 50, default: 'commission_percent' })
  rewardType?: string;

  @ApiPropertyOptional({ description: 'Giá trị phần thưởng', default: 10 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  rewardValue?: number;

  @ApiProperty({ description: 'Trạng thái hoạt động', default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @OneToMany(() => ReferralEventEntity, event => event.referralCode)
  events?: ReferralEventEntity[];
}
