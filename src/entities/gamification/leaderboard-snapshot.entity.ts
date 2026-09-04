import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';

/**
 * Bảng `leaderboard_snapshots` — bảng xếp hạng đã chốt theo kỳ.
 *
 * Chốt sẵn thay vì tính trực tiếp: xếp hạng toàn hệ thống là truy vấn nặng và
 * người dùng xem rất nhiều. `periodKey` là nhãn kỳ, vd `2026-W36`, `2026-09`.
 */
@Entity('leaderboard_snapshots')
@Index('uq_leaderboard_snapshots_entry', ['boardType', 'period', 'periodKey', 'userId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_leaderboard_snapshots_board', ['boardType', 'period', 'periodKey', 'rank'])
export class LeaderboardSnapshotEntity extends PrimaryBaseEntity {
  @ApiProperty({ enum: enumData.LEADERBOARD_BOARD_TYPE, description: 'Loại bảng xếp hạng' })
  @Column({ type: 'varchar', length: 30 })
  boardType: string;

  @ApiProperty({ enum: enumData.LEADERBOARD_PERIOD, description: 'Chu kỳ xếp hạng' })
  @Column({ type: 'varchar', length: 20 })
  period: string;

  @ApiProperty({ description: 'Nhãn kỳ, vd 2026-W36 hoặc 2026-09' })
  @Column({ type: 'varchar', length: 20 })
  periodKey: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Hạng trong kỳ' })
  @Column({ type: 'int' })
  rank: number;

  @ApiProperty({ description: 'Điểm dùng để xếp hạng' })
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  score: number;

  @ApiPropertyOptional({ description: 'Dữ liệu kèm để render (tên, avatar, cấp độ)' })
  @Column({ type: 'jsonb', nullable: true })
  metadataJson?: Record<string, unknown>;

  @ApiProperty({ description: 'Thời điểm chốt bảng' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  snapshottedAt: Date;
}
