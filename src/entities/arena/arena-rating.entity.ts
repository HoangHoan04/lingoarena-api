import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';

/**
 * Bảng `arena_ratings` — ELO của người chơi, tách riêng theo từng kỹ năng.
 * Giỏi Reading không có nghĩa là giỏi Listening, nên không dùng một ELO chung.
 */
@Entity('arena_ratings')
@Index('uq_arena_ratings_user_structure', ['userId', 'examStructureId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_arena_ratings_elo', ['examStructureId', 'eloRating'])
export class ArenaRatingEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người chơi' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Kỹ năng — node cấu trúc cấp SKILL' })
  @Column({ type: 'uuid' })
  examStructureId: string;

  @ApiProperty({ description: 'Điểm ELO hiện tại' })
  @Column({ type: 'int', default: 1000 })
  eloRating: number;

  @ApiProperty({ description: 'ELO cao nhất từng đạt' })
  @Column({ type: 'int', default: 1000 })
  peakElo: number;

  @ApiProperty({ description: 'Số trận đã đấu' })
  @Column({ type: 'int', default: 0 })
  matchesPlayed: number;

  @ApiProperty({ description: 'Số trận thắng' })
  @Column({ type: 'int', default: 0 })
  wins: number;

  @ApiProperty({ description: 'Số trận thua' })
  @Column({ type: 'int', default: 0 })
  losses: number;

  @ApiProperty({ description: 'Số trận hòa' })
  @Column({ type: 'int', default: 0 })
  draws: number;
}
