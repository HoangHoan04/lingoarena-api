import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionVersionEntity } from '../question/question-version.entity';
import { QuestionEntity } from '../question/question.entity';
import { AssessmentAttemptEntity } from './assessment-attempt.entity';
import { AttemptAnswerEntity } from './attempt-answer.entity';
import { AttemptSectionEntity } from './attempt-section.entity';

@Entity('attempt_questions')
@Index('idx_attempt_questions_attempt_id', ['attemptId'])
@Index('idx_attempt_questions_question_id', ['questionId'])
@Index('idx_attempt_questions_unique', ['attemptId', 'questionId'], { unique: true })
export class AttemptQuestionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến lượt làm bài' })
  @Column({ type: 'uuid' })
  attemptId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phần của lượt làm bài' })
  @Column({ type: 'uuid' })
  attemptSectionId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi' })
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phiên bản câu hỏi' })
  @Column({ type: 'uuid' })
  questionVersionId: string;

  @ApiProperty({ description: 'Snapshot nội dung câu hỏi đóng băng dạng JSON' })
  @Column({ type: 'jsonb' })
  questionSnapshotJson: Record<string, unknown>;

  @ApiProperty({ description: 'Snapshot đáp án chuẩn đóng băng dạng JSON' })
  @Column({ type: 'jsonb' })
  correctAnswerSnapshotJson: Record<string, unknown>;

  @ApiProperty({ description: 'Số điểm của câu hỏi', default: 1 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  points: number;

  @ApiProperty({ description: 'Thứ tự hiển thị', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Thời điểm hiển thị câu hỏi cho thí sinh' })
  @Column({ type: 'timestamptz', nullable: true })
  displayedAt?: Date;

  @ManyToOne(() => AssessmentAttemptEntity, attempt => attempt.attemptQuestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attemptId' })
  attempt?: AssessmentAttemptEntity;

  @ManyToOne(() => AttemptSectionEntity, section => section.attemptQuestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attemptSectionId' })
  attemptSection?: AttemptSectionEntity;

  @ManyToOne(() => QuestionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionId' })
  question?: QuestionEntity;

  @ManyToOne(() => QuestionVersionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionVersionId' })
  questionVersion?: QuestionVersionEntity;

  @OneToOne(() => AttemptAnswerEntity, answer => answer.attemptQuestion)
  answer?: AttemptAnswerEntity;
}
