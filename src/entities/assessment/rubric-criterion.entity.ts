import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { RubricEntity } from './rubric.entity';

@Entity('rubric_criteria')
@Index('idx_rubric_criteria_code', ['rubricId', 'code'], { unique: true })
@Index('idx_rubric_criteria_rubric_id', ['rubricId'])
export class RubricCriterionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến rubric' })
  @Column({ type: 'uuid' })
  rubricId: string;

  @ApiProperty({
    description: 'Mã tiêu chí (TASK_ACHIEVEMENT, COHERENCE_COHESION, LEXICAL_RESOURCE, GRAMMAR)',
  })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ description: 'Tên tiêu chí' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả tiêu chí' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Điểm tối đa', default: 9 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 9 })
  maxScore: number;

  @ApiProperty({ description: 'Trọng số tiêu chí', default: 1 })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1 })
  weight: number;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => RubricEntity, rubric => rubric.criteria, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rubricId' })
  rubric?: RubricEntity;
}
