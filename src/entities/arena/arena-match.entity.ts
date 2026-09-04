import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamStructureEntity } from '../exam/exam-structure.entity';
import { ArenaMatchParticipantEntity } from './arena-match-participant.entity';
import { ArenaMatchQuestionEntity } from './arena-match-question.entity';

/**
 * Bảng `arena_matches` — một trận đấu.
 * Ghi 1 dòng action log khi trận kết thúc, không log từng câu trả lời
 * (quyết định 9.4).
 */
@Entity('arena_matches')
@Index('idx_arena_matches_status', ['status'])
@Index('idx_arena_matches_structure', ['examStructureId'])
export class ArenaMatchEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Kỹ năng thi đấu — node cấu trúc cấp SKILL (bắt buộc)' })
  @Column({ type: 'uuid' })
  examStructureId: string;

  @ApiPropertyOptional({ description: 'Chủ đề của trận' })
  @Column({ type: 'uuid', nullable: true })
  taxonomyId?: string;

  @ApiProperty({ enum: enumData.ARENA_MATCH_MODE, description: 'Chế độ chơi' })
  @Column({ type: 'varchar', length: 20 })
  matchMode: string;

  @ApiProperty({ description: 'Số người chơi tối đa' })
  @Column({ type: 'int', default: 2 })
  maxPlayers: number;

  @ApiProperty({ description: 'Số câu hỏi trong trận' })
  @Column({ type: 'int', default: 10 })
  questionCount: number;

  @ApiProperty({ description: 'Thời lượng trận (giây)' })
  @Column({ type: 'int', default: 300 })
  durationSeconds: number;

  @ApiProperty({
    enum: enumData.ARENA_MATCH_STATUS,
    default: enumData.ARENA_MATCH_STATUS.WAITING.code,
    description: 'Trạng thái trận',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ARENA_MATCH_STATUS.WAITING.code })
  status: string;

  @ApiPropertyOptional({ description: 'Thời điểm bắt đầu' })
  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm kết thúc' })
  @Column({ type: 'timestamptz', nullable: true })
  finishedAt?: Date;

  @ApiPropertyOptional({ description: 'Cấu hình riêng của trận' })
  @Column({ type: 'jsonb', nullable: true })
  matchConfigJson?: Record<string, unknown>;

  @ManyToOne(() => ExamStructureEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examStructureId' })
  examStructure?: ExamStructureEntity;

  @OneToMany(() => ArenaMatchQuestionEntity, question => question.arenaMatch)
  questions?: ArenaMatchQuestionEntity[];

  @OneToMany(() => ArenaMatchParticipantEntity, participant => participant.arenaMatch)
  participants?: ArenaMatchParticipantEntity[];
}
