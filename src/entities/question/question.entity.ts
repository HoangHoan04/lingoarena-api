import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamStructureEntity } from '../exam/exam-structure.entity';
import { ExamTypeEntity } from '../exam/exam-type.entity';
import { QuestionGroupEntity } from './question-group.entity';
import { QuestionOptionEntity } from './question-option.entity';

/**
 * Bảng `questions` — câu hỏi (đã gộp nội dung, bỏ versioning).
 *
 * Nội dung soạn thảo (prompt, đáp án, giải thích...) nằm thẳng trên bảng này.
 * Lịch sử chỉnh sửa được ghi qua `action_logs`, không dùng bảng version riêng.
 */
@Entity('questions')
@Index('idx_questions_question_type', ['questionType'])
@Index('idx_questions_exam_type', ['examTypeId'])
@Index('idx_questions_exam_structure', ['examStructureId'])
@Index('idx_questions_group', ['questionGroupId'])
export class QuestionEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến nhóm câu hỏi' })
  @Column({ type: 'uuid', nullable: true })
  questionGroupId?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid', nullable: true })
  examTypeId?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến node cấu trúc kỳ thi' })
  @Column({ type: 'uuid', nullable: true })
  examStructureId?: string;

  @ApiProperty({ enum: enumData.QUESTION_TYPE_CODE, description: 'Dạng câu hỏi' })
  @Column({ type: 'varchar', length: 30 })
  questionType: string;

  @ApiPropertyOptional({ description: 'Số hiệu câu trong nhóm' })
  @Column({ type: 'int', nullable: true })
  questionNumber?: number;

  @ApiProperty({
    enum: enumData.DIFFICULTY_LEVEL,
    default: 3,
    description: 'Độ khó từ 1 đến 5',
  })
  @Column({ type: 'int', default: 3 })
  difficultyLevel: number;

  @ApiPropertyOptional({ enum: enumData.CEFR_LEVEL, description: 'Trình độ CEFR' })
  @Column({ type: 'varchar', length: 10, nullable: true })
  cefrLevel?: string;

  @ApiProperty({ description: 'Điểm mặc định của câu' })
  @Column({ type: 'numeric', precision: 6, scale: 2, default: 1 })
  defaultPoints: number;

  @ApiProperty({
    enum: enumData.GRADING_STRATEGY,
    default: enumData.GRADING_STRATEGY.EXACT_MATCH.code,
    description: 'Cách chấm điểm',
  })
  @Column({ type: 'varchar', length: 30, default: enumData.GRADING_STRATEGY.EXACT_MATCH.code })
  gradingStrategy: string;

  @ApiPropertyOptional({ description: 'Rubric dùng khi chấm chủ quan (Writing / Speaking)' })
  @Column({ type: 'uuid', nullable: true })
  rubricId?: string;

  @ApiPropertyOptional({ description: 'Số từ tối thiểu với bài viết' })
  @Column({ type: 'int', nullable: true })
  minWords?: number;

  @ApiPropertyOptional({ description: 'Số từ tối đa với bài viết' })
  @Column({ type: 'int', nullable: true })
  maxWords?: number;

  @ApiPropertyOptional({ description: 'Giới hạn thời gian làm câu này (phút)' })
  @Column({ type: 'int', nullable: true })
  timeLimitMin?: number;

  @ApiPropertyOptional({ description: 'Người tạo câu hỏi' })
  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  // ── Nội dung câu hỏi (trước đây ở question_versions) ──────────────────────

  @ApiProperty({ description: 'Đề bài' })
  @Column({ type: 'text', default: '' })
  prompt: string;

  @ApiPropertyOptional({ description: 'Hướng dẫn riêng cho câu' })
  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @ApiPropertyOptional({ description: 'Cấu trúc nội dung phức tạp (matching, drag-drop)' })
  @Column({ type: 'jsonb', nullable: true })
  contentJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Đáp án đúng. Null với ESSAY / AUDIO_RECORD' })
  @Column({ type: 'jsonb', nullable: true })
  correctAnswerJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Giải thích đáp án (tiếng Việt)' })
  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @ApiPropertyOptional({ description: 'Giải thích đáp án (tiếng Anh)' })
  @Column({ type: 'text', nullable: true })
  explanationEn?: string;

  @ApiPropertyOptional({ description: 'Bài mẫu (Writing)' })
  @Column({ type: 'text', nullable: true })
  sampleAnswer?: string;

  @ApiPropertyOptional({ description: 'Band của bài mẫu (vd "7.0")' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  sampleBand?: string;

  @ApiPropertyOptional({ description: 'Phân tích bài mẫu bằng tiếng Việt' })
  @Column({ type: 'text', nullable: true })
  sampleAnalysisVi?: string;

  @ApiPropertyOptional({ description: 'Gợi ý dàn ý — lưu jsonb' })
  @Column({ type: 'jsonb', nullable: true })
  outlineIdeasJson?: string[];

  @ApiPropertyOptional({ description: 'Từ vựng gợi ý — lưu jsonb' })
  @Column({ type: 'jsonb', nullable: true })
  suggestedVocabJson?: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Ảnh đề bài' })
  @Column({ type: 'text', nullable: true })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu phụ: evidenceSegmentIndex, targetStructure...' })
  @Column({ type: 'jsonb', nullable: true })
  metaJson?: Record<string, unknown>;

  // ── Relations ──────────────────────────────────────────────────────────────

  @ManyToOne(() => QuestionGroupEntity, group => group.questions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'questionGroupId' })
  questionGroup?: QuestionGroupEntity;

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;

  @ManyToOne(() => ExamStructureEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'examStructureId' })
  examStructure?: ExamStructureEntity;

  @OneToMany(() => QuestionOptionEntity, option => option.question)
  options?: QuestionOptionEntity[];
}
