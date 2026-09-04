import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';

/**
 * Bảng `point_ledger_entries` — sổ cái điểm, chỉ thêm không sửa.
 *
 * Bản thân bảng đã là lịch sử đầy đủ nên KHÔNG ghi action log cho nó
 * (quyết định 9.4). `points` cho phép số âm để trừ điểm / điều chỉnh tay.
 */
@Entity('point_ledger_entries')
@Index('idx_point_ledger_entries_user', ['userId', 'earnedAt'])
@Index('idx_point_ledger_entries_reason', ['userId', 'reason'])
export class PointLedgerEntryEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: enumData.POINT_REASON, description: 'Lý do cộng / trừ điểm' })
  @Column({ type: 'varchar', length: 30 })
  reason: string;

  @ApiProperty({ description: 'Số điểm, âm nghĩa là trừ' })
  @Column({ type: 'int' })
  points: number;

  @ApiPropertyOptional({ description: 'Loại nguồn phát sinh điểm' })
  @Column({ type: 'varchar', length: 30, nullable: true })
  sourceType?: string;

  @ApiPropertyOptional({ description: 'ID nguồn tương ứng với sourceType' })
  @Column({ type: 'uuid', nullable: true })
  sourceId?: string;

  @ApiProperty({ description: 'Thời điểm ghi nhận' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  earnedAt: Date;
}
