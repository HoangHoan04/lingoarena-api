import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSkillEntity } from '../exam/exam-skill.entity';
import { AssessmentItemEntity } from './assessment-item.entity';
import { AssessmentEntity } from './assessment.entity';

@Entity('assessment_sections')
@Index('idx_assessment_sections_assessment_id', ['assessmentId'])
export class AssessmentSectionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến bài đánh giá' })
  @Column({ type: 'uuid' })
  assessmentId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến kỹ năng kỳ thi' })
  @Column({ type: 'uuid' })
  examSkillId: string;

  @ApiProperty({ description: 'Tiêu đề phần thi' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Hướng dẫn làm phần thi' })
  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @ApiPropertyOptional({ description: 'Thời lượng tính bằng giây', default: 0 })
  @Column({ type: 'int', default: 0, nullable: true })
  durationSeconds?: number;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => AssessmentEntity, assessment => assessment.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessmentId' })
  assessment?: AssessmentEntity;

  @ManyToOne(() => ExamSkillEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examSkillId' })
  examSkill?: ExamSkillEntity;

  @OneToMany(() => AssessmentItemEntity, item => item.assessmentSection)
  items?: AssessmentItemEntity[];
}
