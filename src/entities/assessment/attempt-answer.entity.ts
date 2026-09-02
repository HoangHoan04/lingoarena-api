import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { MediaAssetEntity } from '../media/media-asset.entity';
import { AnswerEventEntity } from './answer-event.entity';
import { AttemptQuestionEntity } from './attempt-question.entity';
import { GradingTaskEntity } from './grading-task.entity';

@Entity('attempt_answers')
@Index('idx_attempt_answers_question_id', ['attemptQuestionId'])
@Index('idx_attempt_answers_grading_status', ['gradingStatus'])
export class AttemptAnswerEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi trong lượt làm bài' })
  @Column({ type: 'uuid', unique: true })
  attemptQuestionId: string;

  @ApiPropertyOptional({ description: 'Câu trả lời trắc nghiệm dạng JSON' })
  @Column({ type: 'jsonb', nullable: true })
  answerJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Nội dung bài viết tự luận' })
  @Column({ type: 'text', nullable: true })
  answerText?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến bài nói âm thanh' })
  @Column({ type: 'uuid', nullable: true })
  audioAssetId?: string;

  @ApiPropertyOptional({ description: 'Cờ đáp án đúng' })
  @Column({ type: 'boolean', nullable: true })
  isCorrect?: boolean;

  @ApiPropertyOptional({ description: 'Điểm được trao', default: 0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  scoreAwarded?: number;

  @ApiProperty({
    enum: enumData.GRADING_STATUS,
    default: enumData.GRADING_STATUS.PENDING.code,
    description: 'Trạng thái chấm điểm',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.GRADING_STATUS.PENDING.code })
  gradingStatus: string;

  @ApiPropertyOptional({
    enum: enumData.GRADER_TYPE,
    default: enumData.GRADER_TYPE.SYSTEM,
    description: 'Loại người chấm điểm',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.GRADER_TYPE.SYSTEM.code })
  graderType?: string;

  @ApiPropertyOptional({ description: 'Thời điểm trả lời' })
  @Column({ type: 'timestamptz', nullable: true })
  answeredAt?: Date;

  @ApiProperty({ description: 'Thời điểm tự động lưu autosave' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastSavedAt: Date;

  @ApiPropertyOptional({ description: 'Dữ liệu nhận xét phản hồi JSON' })
  @Column({ type: 'jsonb', nullable: true })
  feedbackJson?: Record<string, unknown>;

  @OneToOne(() => AttemptQuestionEntity, aq => aq.answer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attemptQuestionId' })
  attemptQuestion?: AttemptQuestionEntity;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'audioAssetId' })
  audioAsset?: MediaAssetEntity;

  @OneToMany(() => AnswerEventEntity, event => event.attemptAnswer)
  events?: AnswerEventEntity[];

  @OneToOne(() => GradingTaskEntity, task => task.attemptAnswer)
  gradingTask?: GradingTaskEntity;
}
