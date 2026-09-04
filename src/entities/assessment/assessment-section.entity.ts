import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamStructureEntity } from '../exam/exam-structure.entity';
import { AssessmentItemEntity } from './assessment-item.entity';
import { AssessmentEntity } from './assessment.entity';

/** Bảng `assessment_sections` — phần của đề thi, gắn với một kỹ năng. */
@Entity('assessment_sections')
@Index('idx_assessment_sections_assessment', ['assessmentId'])
export class AssessmentSectionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến đề thi' })
  @Column({ type: 'uuid' })
  assessmentId: string;

  @ApiProperty({
    description: 'Khóa ngoại tham chiếu đến node cấu trúc kỳ thi (cấp SKILL)',
  })
  @Column({ type: 'uuid' })
  examStructureId: string;

  @ApiProperty({ description: 'Tiêu đề phần' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Hướng dẫn làm phần này' })
  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @ApiPropertyOptional({ description: 'Thời lượng riêng của phần (giây)' })
  @Column({ type: 'int', nullable: true })
  durationSeconds?: number;

  @ApiProperty({ description: 'Thứ tự phần trong đề' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => AssessmentEntity, assessment => assessment.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessmentId' })
  assessment?: AssessmentEntity;

  @ManyToOne(() => ExamStructureEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examStructureId' })
  examStructure?: ExamStructureEntity;

  @OneToMany(() => AssessmentItemEntity, item => item.assessmentSection)
  items?: AssessmentItemEntity[];
}
