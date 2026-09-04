import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { AssessmentAttemptEntity } from './assessment-attempt.entity';
import { AttemptAnswerEntity } from './attempt-answer.entity';

/**
 * Bảng `attempt_questions` — bản chụp bất biến của câu hỏi tại thời điểm thi.
 *
 * Snapshot giữ lượt thi **đã làm** nguyên vẹn ngay cả khi version câu hỏi bị
 * xoá. Cột `assessmentSectionId` thay hẳn bảng `attempt_sections` cũ.
 */
@Entity('attempt_questions')
@Index('idx_attempt_questions_attempt', ['attemptId', 'sortOrder'])
export class AttemptQuestionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến lượt làm bài' })
  @Column({ type: 'uuid' })
  attemptId: string;

  @ApiPropertyOptional({ description: 'Phần của đề — thay bảng attempt_sections' })
  @Column({ type: 'uuid', nullable: true })
  assessmentSectionId?: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi gốc' })
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Bản chụp toàn bộ nội dung câu hỏi đã hiển thị' })
  @Column({ type: 'jsonb' })
  questionSnapshotJson: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Bản chụp đáp án đúng' })
  @Column({ type: 'jsonb', nullable: true })
  correctAnswerSnapshotJson?: Record<string, unknown>;

  @ApiProperty({ description: 'Điểm của câu trong lượt thi này' })
  @Column({ type: 'numeric', precision: 6, scale: 2, default: 1 })
  points: number;

  @ApiProperty({ description: 'Thứ tự câu trong lượt thi' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Thời điểm câu được hiển thị cho người học' })
  @Column({ type: 'timestamptz', nullable: true })
  displayedAt?: Date;

  @ManyToOne(() => AssessmentAttemptEntity, attempt => attempt.attemptQuestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attemptId' })
  attempt?: AssessmentAttemptEntity;

  @OneToOne(() => AttemptAnswerEntity, answer => answer.attemptQuestion)
  answer?: AttemptAnswerEntity;
}
