import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionVersionEntity } from '../question/question-version.entity';
import { QuestionEntity } from '../question/question.entity';
import { AssessmentSectionEntity } from './assessment-section.entity';

@Entity('assessment_items')
@Index('idx_assessment_items_section_id', ['assessmentSectionId'])
@Index('idx_assessment_items_question_id', ['questionId'])
export class AssessmentItemEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phần của bài đánh giá' })
  @Column({ type: 'uuid' })
  assessmentSectionId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi' })
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phiên bản câu hỏi' })
  @Column({ type: 'uuid' })
  questionVersionId: string;

  @ApiProperty({ description: 'Số điểm ghi nhận', default: 1 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  points: number;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Bắt buộc làm câu hỏi này', default: true })
  @Column({ type: 'boolean', default: true })
  isRequired: boolean;

  @ManyToOne(() => AssessmentSectionEntity, section => section.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessmentSectionId' })
  assessmentSection?: AssessmentSectionEntity;

  @ManyToOne(() => QuestionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionId' })
  question?: QuestionEntity;

  @ManyToOne(() => QuestionVersionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionVersionId' })
  questionVersion?: QuestionVersionEntity;
}
