import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ArenaMatchParticipantEntity } from './arena-match-participant.entity';
import { ArenaMatchQuestionEntity } from './arena-match-question.entity';

@Entity('arena_match_answers')
@Index('idx_arena_match_answers_unique', ['matchParticipantId', 'arenaMatchQuestionId'], {
  unique: true,
})
@Index('idx_arena_match_answers_part_id', ['matchParticipantId'])
export class ArenaMatchAnswerEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người tham gia trận đấu' })
  @Column({ type: 'uuid' })
  matchParticipantId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi trong trận' })
  @Column({ type: 'uuid' })
  arenaMatchQuestionId: string;

  @ApiPropertyOptional({ description: 'Câu trả lời dạng JSON' })
  @Column({ type: 'jsonb', nullable: true })
  answerJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Cờ đáp án đúng' })
  @Column({ type: 'boolean', nullable: true })
  isCorrect?: boolean;

  @ApiProperty({ description: 'Thời gian trả lời tính bằng ms', default: 0 })
  @Column({ type: 'int', default: 0 })
  timeTakenMs: number;

  @ApiProperty({ description: 'Thời điểm trả lời' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  answeredAt: Date;

  @ManyToOne(() => ArenaMatchParticipantEntity, participant => participant.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'matchParticipantId' })
  participant?: ArenaMatchParticipantEntity;

  @ManyToOne(() => ArenaMatchQuestionEntity, question => question.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'arenaMatchQuestionId' })
  arenaMatchQuestion?: ArenaMatchQuestionEntity;
}
