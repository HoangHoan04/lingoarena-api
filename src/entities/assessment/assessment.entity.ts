import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseEntity } from '../course/course.entity';

import { enumData } from '~/common/enums/base.enum';
import { ExamTypeEntity } from '../exam/exam-type.entity';
import { AssessmentAttemptEntity } from './assessment-attempt.entity';
import { AssessmentSectionEntity } from './assessment-section.entity';

@Entity('assessments')
@Index('idx_assessments_slug', ['slug'], { unique: true })
@Index('idx_assessments_exam_type_id', ['examTypeId'])
@Index('idx_assessments_type', ['assessmentType'])
@Index('idx_assessments_status', ['status'])
export class AssessmentEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid' })
  examTypeId: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến khóa học' })
  @Column({ type: 'uuid', nullable: true })
  courseId?: string;

  @ApiProperty({
    enum: enumData.ASSESSMENT_TYPE,
    default: enumData.ASSESSMENT_TYPE.MOCK_EXAM.code,
    description: 'Loại bài đánh giá',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ASSESSMENT_TYPE.MOCK_EXAM.code })
  assessmentType: string;

  @ApiProperty({ description: 'Tiêu đề bài đánh giá / đề thi' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Chuỗi slug thân thiện với URL' })
  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Thời lượng tính bằng giây (0 = không giới hạn thời gian)',
    default: 0,
  })
  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @ApiPropertyOptional({ description: 'Số lần làm bài tối đa (0 = không giới hạn)', default: 0 })
  @Column({ type: 'int', default: 0, nullable: true })
  maxAttempts?: number;

  @ApiPropertyOptional({ description: 'Điểm chuẩn đạt' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  passingScore?: number;

  @ApiProperty({
    enum: enumData.SELECTION_MODE,
    default: enumData.SELECTION_MODE.FIXED.code,
    description: 'Chế độ chọn câu hỏi',
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
    length: 20,
    default: enumData.SHOW_ANSWERS_POLICY.AFTER_SUBMISSION.code,
  })
  showAnswersPolicy: string;

  @ApiProperty({
    enum: enumData.ASSESSMENT_STATUS,
    default: enumData.ASSESSMENT_STATUS.DRAFT.code,
    description: 'Trạng thái bài thi',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ASSESSMENT_STATUS.DRAFT.code })
  status: string;

  @ApiProperty({ description: 'Cờ làm bài miễn phí', default: false })
  @Column({ type: 'boolean', default: false })
  isFree: boolean;

  @ApiPropertyOptional({ description: 'ID người tạo đề thi' })
  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;

  @ManyToOne(() => CourseEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'courseId' })
  course?: CourseEntity;

  @OneToMany(() => AssessmentSectionEntity, section => section.assessment)
  sections?: AssessmentSectionEntity[];

  @OneToMany(() => AssessmentAttemptEntity, attempt => attempt.assessment)
  attempts?: AssessmentAttemptEntity[];
}
