import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamStructureEntity } from '../exam/exam-structure.entity';
import { ExamTypeEntity } from '../exam/exam-type.entity';
import { AssessmentSectionEntity } from './assessment-section.entity';

/**
 * Bảng `assessments` — đề thi / bài kiểm tra có cấu trúc.
 *
 * `isFree = false` thì mở đề cần `user_entitlements` với
 * `resourceType = assessment` (resourceId = id đề) hoặc `all_access`.
 */
@Entity('assessments')
@Index('uq_assessments_slug_alive', ['slug'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_assessments_exam_type', ['examTypeId'])
@Index('idx_assessments_exam_structure', ['examStructureId'])
@Index('idx_assessments_type', ['assessmentType'])
export class AssessmentEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid' })
  examTypeId: string;

  @ApiPropertyOptional({
    description: 'Kỹ năng chính của đề (node SKILL trong exam_structures)',
  })
  @Column({ type: 'uuid', nullable: true })
  examStructureId?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến khóa học (nếu đề thuộc khóa)' })
  @Column({ type: 'uuid', nullable: true })
  courseId?: string;

  @ApiProperty({ enum: enumData.ASSESSMENT_TYPE, description: 'Loại đề' })
  @Column({ type: 'varchar', length: 30 })
  assessmentType: string;

  @ApiProperty({ description: 'Slug dùng trên URL' })
  @Column({ type: 'varchar', length: 150 })
  slug: string;

  @ApiProperty({ description: 'Tiêu đề đề thi' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Thời lượng làm bài (giây)' })
  @Column({ type: 'int' })
  durationSeconds: number;

  @ApiPropertyOptional({ description: 'Số lượt làm tối đa, null là không giới hạn' })
  @Column({ type: 'int', nullable: true })
  maxAttempts?: number;

  @ApiPropertyOptional({ description: 'Điểm đạt' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  passingScore?: number;

  @ApiProperty({
    enum: enumData.SELECTION_MODE,
    default: enumData.SELECTION_MODE.FIXED.code,
    description: 'Cách chọn câu hỏi',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.SELECTION_MODE.FIXED.code })
  selectionMode: string;

  @ApiProperty({
    enum: enumData.SHOW_ANSWERS_POLICY,
    default: enumData.SHOW_ANSWERS_POLICY.AFTER_SUBMISSION.code,
    description: 'Chính sách hiển thị đáp án',
  })
  @Column({
    type: 'varchar',
    length: 30,
    default: enumData.SHOW_ANSWERS_POLICY.AFTER_SUBMISSION.code,
  })
  showAnswersPolicy: string;

  @ApiProperty({ description: 'Đề miễn phí hay cần quyền truy cập' })
  @Column({ type: 'boolean', default: true })
  isFree: boolean;

  @ApiProperty({ description: 'Số lượt đã làm — denormalize để list không phải count' })
  @Column({ type: 'int', default: 0 })
  attemptCount: number;

  @ApiPropertyOptional({ description: 'Người tạo đề' })
  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;

  @ManyToOne(() => ExamStructureEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'examStructureId' })
  examStructure?: ExamStructureEntity;

  @OneToMany(() => AssessmentSectionEntity, section => section.assessment)
  sections?: AssessmentSectionEntity[];
}
