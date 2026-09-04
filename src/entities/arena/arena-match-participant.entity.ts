import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ArenaMatchEntity } from './arena-match.entity';

/** Bảng `arena_match_participants` — người chơi trong một trận. */
@Entity('arena_match_participants')
@Index('uq_arena_match_participants_link', ['arenaMatchId', 'userId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_arena_match_participants_user', ['userId'])
export class ArenaMatchParticipantEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến trận đấu' })
  @Column({ type: 'uuid' })
  arenaMatchId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người chơi' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Đây có phải đối thủ máy' })
  @Column({ type: 'boolean', default: false })
  isBot: boolean;

  @ApiProperty({ description: 'Điểm đạt được trong trận' })
  @Column({ type: 'int', default: 0 })
  score: number;

  @ApiProperty({ description: 'Số câu trả lời đúng' })
  @Column({ type: 'int', default: 0 })
  correctCount: number;

  @ApiProperty({ description: 'Tổng số câu đã trả lời' })
  @Column({ type: 'int', default: 0 })
  totalAnswered: number;

  @ApiPropertyOptional({
    enum: enumData.ARENA_PARTICIPANT_RESULT,
    description: 'Kết quả, null khi trận chưa xong',
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  result?: string;

  @ApiProperty({ description: 'Điểm ELO trước trận' })
  @Column({ type: 'int', default: 1000 })
  eloBefore: number;

  @ApiProperty({ description: 'Mức thay đổi ELO sau trận' })
  @Column({ type: 'int', default: 0 })
  eloChange: number;

  @ApiProperty({ description: 'Thời điểm vào trận' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @ManyToOne(() => ArenaMatchEntity, match => match.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'arenaMatchId' })
  arenaMatch?: ArenaMatchEntity;
}
