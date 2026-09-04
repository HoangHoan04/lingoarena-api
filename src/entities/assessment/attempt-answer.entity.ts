import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { AttemptQuestionEntity } from './attempt-question.entity';

/**
 * Bảng `attempt_answers` — câu trả lời của người học.
 *
 * `eventsJson` thay bảng `answer_events` cũ: lịch sử thao tác trên một câu luôn
 * đọc kèm câu trả lời và không lọc theo, nên lưu jsonb.
 *
 * Dạng ESSAY / AUDIO_RECORD để `gradingStatus = PENDING` và KHÔNG cộng điểm cho
 * tới khi có `answer_evaluations`.
 */
@Entity('attempt_answers')
export class AttemptAnswerEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu trong lượt thi' })
  @Column({ type: 'uuid', unique: true })
  attemptQuestionId: string;

  @ApiProperty({ description: 'Nội dung trả lời' })
  @Column({ type: 'jsonb' })
  answerJson: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Đúng hay sai, null khi chưa chấm' })
  @Column({ type: 'boolean', nullable: true })
  isCorrect?: boolean;

  @ApiPropertyOptional({ description: 'Điểm được cộng' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  scoreAwarded?: number;

  @ApiProperty({
    enum: enumData.GRADING_STATUS,
    default: enumData.GRADING_STATUS.PENDING.code,
    description: 'Trạng thái chấm câu này',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.GRADING_STATUS.PENDING.code })
  gradingStatus: string;

  @ApiPropertyOptional({
    description: 'Lịch sử thao tác trên câu (đổi đáp án, đánh dấu) — thay bảng answer_events',
  })
  @Column({ type: 'jsonb', nullable: true })
  eventsJson?: Record<string, unknown>[];

  @ApiProperty({ description: 'Thời điểm trả lời gần nhất' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  answeredAt: Date;

  @OneToOne(() => AttemptQuestionEntity, question => question.answer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attemptQuestionId' })
  attemptQuestion?: AttemptQuestionEntity;
}
