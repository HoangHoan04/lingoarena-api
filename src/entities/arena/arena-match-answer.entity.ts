import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ArenaMatchQuestionEntity } from './arena-match-question.entity';

/**
 * Bảng `arena_match_answers` — câu trả lời của một người chơi cho một câu trong trận.
 *
 * `timeTakenMs` tính bằng milli giây vì điểm arena phụ thuộc tốc độ trả lời;
 * đơn vị giây không đủ mịn để phân định người nhanh hơn.
 */
@Entity('arena_match_answers')
@Index('uq_arena_match_answers_link', ['arenaMatchQuestionId', 'userId'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class ArenaMatchAnswerEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi trong trận' })
  @Column({ type: 'uuid' })
  arenaMatchQuestionId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người trả lời' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Nội dung trả lời' })
  @Column({ type: 'jsonb' })
  answerJson: Record<string, unknown>;

  @ApiProperty({ description: 'Đúng hay sai' })
  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @ApiProperty({ description: 'Thời gian trả lời (milli giây)' })
  @Column({ type: 'int', default: 0 })
  timeTakenMs: number;

  @ApiProperty({ description: 'Điểm được cộng, có tính hệ số tốc độ' })
  @Column({ type: 'int', default: 0 })
  pointsAwarded: number;

  @ManyToOne(() => ArenaMatchQuestionEntity, question => question.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'arenaMatchQuestionId' })
  arenaMatchQuestion?: ArenaMatchQuestionEntity;
}
