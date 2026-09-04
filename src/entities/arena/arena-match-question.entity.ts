import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ArenaMatchAnswerEntity } from './arena-match-answer.entity';
import { ArenaMatchEntity } from './arena-match.entity';

/**
 * Bảng `arena_match_questions` — câu hỏi được bốc vào trận, kèm bản chụp.
 *
 * Chỉ nhận version `APPROVED` và thuộc nhóm chấm tự động được
 * (`SINGLE_CHOICE`, `MULTI_CHOICE`, `TRUE_FALSE_NG`, `FILL_BLANK`, `MATCHING`) —
 * trận đấu real-time không chờ được người chấm.
 */
@Entity('arena_match_questions')
@Index('idx_arena_match_questions_match', ['arenaMatchId', 'sortOrder'])
export class ArenaMatchQuestionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến trận đấu' })
  @Column({ type: 'uuid' })
  arenaMatchId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi gốc' })
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Bản chụp nội dung câu hỏi kèm đáp án đúng' })
  @Column({ type: 'jsonb' })
  questionSnapshotJson: Record<string, unknown>;

  @ApiProperty({ description: 'Thứ tự câu trong trận' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Giới hạn thời gian cho câu này (giây)' })
  @Column({ type: 'int', default: 30 })
  timeLimitSeconds: number;

  @ManyToOne(() => ArenaMatchEntity, match => match.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'arenaMatchId' })
  arenaMatch?: ArenaMatchEntity;

  @OneToMany(() => ArenaMatchAnswerEntity, answer => answer.arenaMatchQuestion)
  answers?: ArenaMatchAnswerEntity[];
}
