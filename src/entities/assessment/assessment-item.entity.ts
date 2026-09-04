import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionEntity } from '../question/question.entity';
import { AssessmentSectionEntity } from './assessment-section.entity';

/** Bảng `assessment_items` — câu hỏi thuộc một phần của đề thi. */
@Entity('assessment_items')
@Index('uq_assessment_items_section_question', ['assessmentSectionId', 'questionId'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class AssessmentItemEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phần của đề' })
  @Column({ type: 'uuid' })
  assessmentSectionId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi' })
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Điểm của câu trong đề này' })
  @Column({ type: 'numeric', precision: 6, scale: 2, default: 1 })
  points: number;

  @ApiProperty({ description: 'Thứ tự câu trong phần' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Câu bắt buộc trả lời' })
  @Column({ type: 'boolean', default: true })
  isRequired: boolean;

  @ManyToOne(() => AssessmentSectionEntity, section => section.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessmentSectionId' })
  assessmentSection?: AssessmentSectionEntity;

  @ManyToOne(() => QuestionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionId' })
  question?: QuestionEntity;
}
