import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { RubricEntity } from './rubric.entity';

/**
 * Bảng `answer_evaluations` — kết quả chấm bài chủ quan.
 * Gộp 6 bảng cũ: `grading_tasks`, `grading_results`,
 * `grading_result_criterion_scores`, `ai_grading_logs` và phần chi tiết của
 * rubric. Cột `status` đóng luôn vai trò hàng đợi chấm, đỡ endpoint
 * `/user/assessment/grading-tasks/:id/run`.
 * Dùng cho cả hai luồng:
 * - Bài trong đề thi  → `attemptAnswerId`
 * - Bài luyện tự do   → `studySessionItemId`
 */
@Entity('answer_evaluations')
@Index('idx_answer_evaluations_attempt_answer', ['attemptAnswerId'])
@Index('idx_answer_evaluations_session_item', ['studySessionItemId'])
@Index('idx_answer_evaluations_status', ['status'])
export class AnswerEvaluationEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Câu trả lời trong đề thi được chấm' })
  @Column({ type: 'uuid', nullable: true })
  attemptAnswerId?: string;

  @ApiPropertyOptional({ description: 'Item trong phiên luyện tập được chấm' })
  @Column({ type: 'uuid', nullable: true })
  studySessionItemId?: string;

  @ApiPropertyOptional({ description: 'Rubric áp dụng' })
  @Column({ type: 'uuid', nullable: true })
  rubricId?: string;

  @ApiProperty({ enum: enumData.GRADER_TYPE, description: 'Ai chấm' })
  @Column({ type: 'varchar', length: 20 })
  graderType: string;

  @ApiPropertyOptional({ description: 'Giáo viên chấm, null nếu AI chấm' })
  @Column({ type: 'uuid', nullable: true })
  graderUserId?: string;

  @ApiProperty({
    enum: enumData.AI_JOB_STATUS,
    default: enumData.AI_JOB_STATUS.PENDING.code,
    description: 'Trạng thái tiến trình chấm, đóng vai trò hàng đợi',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.AI_JOB_STATUS.PENDING.code })
  status: string;

  @ApiPropertyOptional({ description: 'Điểm tổng (vd band 7.0)' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  overallScore?: number;

  @ApiPropertyOptional({ description: 'Nhãn điểm hiển thị' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  scoreLabel?: string;

  @ApiPropertyOptional({
    description: 'Điểm từng tiêu chí (taskResponse, coherence, lexical, grammar)',
  })
  @Column({ type: 'jsonb', nullable: true })
  criteriaScoresJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Danh sách lỗi phát hiện được' })
  @Column({ type: 'jsonb', nullable: true })
  errorsJson?: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Gợi ý nâng cấp từ vựng' })
  @Column({ type: 'jsonb', nullable: true })
  vocabUpgradesJson?: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Nhận xét tổng quan' })
  @Column({ type: 'text', nullable: true })
  generalFeedback?: string;

  @ApiPropertyOptional({ description: 'Bản viết lại tốt hơn' })
  @Column({ type: 'text', nullable: true })
  improvedText?: string;

  @ApiPropertyOptional({ description: 'Model AI đã dùng' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  aiModel?: string;

  @ApiPropertyOptional({ description: 'Số token prompt' })
  @Column({ type: 'int', nullable: true })
  aiPromptTokens?: number;

  @ApiPropertyOptional({ description: 'Số token sinh ra' })
  @Column({ type: 'int', nullable: true })
  aiCompletionTokens?: number;

  @ApiPropertyOptional({
    description: 'Phản hồi thô từ AI để truy vết — thay bảng ai_grading_logs',
  })
  @Column({ type: 'jsonb', nullable: true })
  aiRawResponseJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Thời điểm chấm xong' })
  @Column({ type: 'timestamptz', nullable: true })
  evaluatedAt?: Date;

  @ManyToOne(() => RubricEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'rubricId' })
  rubric?: RubricEntity;
}
