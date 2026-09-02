import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';

@Entity('point_ledger_entries')
@Index('idx_point_ledger_user_created', ['userId', 'createdAt'])
@Index('idx_point_ledger_ref', ['refType', 'refId'])
export class PointLedgerEntryEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Số điểm (dương cộng, âm trừ)' })
  @Column({ type: 'int' })
  amount: number;

  @ApiProperty({ description: 'Số dư sau giao dịch' })
  @Column({ type: 'int' })
  balanceAfter: number;

  @ApiProperty({ enum: enumData.POINT_REASON, description: 'Lý do biến động điểm' })
  @Column({ type: 'varchar', length: 50 })
  reason: string;

  @ApiPropertyOptional({ description: 'Loại nguồn (arena_match, lesson, order...)' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  refType?: string;

  @ApiPropertyOptional({ description: 'ID nguồn' })
  @Column({ type: 'uuid', nullable: true })
  refId?: string;

  @ApiPropertyOptional({ description: 'Ghi chú' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
