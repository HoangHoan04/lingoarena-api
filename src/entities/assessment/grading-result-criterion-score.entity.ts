import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { GradingResultEntity } from './grading-result.entity';
import { RubricCriterionEntity } from './rubric-criterion.entity';

@Entity('grading_result_criterion_scores')
@Index('uq_grading_result_criterion', ['gradingResultId', 'rubricCriterionId'], { unique: true })
@Index('idx_grading_result_scores_result_id', ['gradingResultId'])
export class GradingResultCriterionScoreEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến kết quả chấm' })
  @Column({ type: 'uuid' })
  gradingResultId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến tiêu chí rubric' })
  @Column({ type: 'uuid' })
  rubricCriterionId: string;

  @ApiProperty({ description: 'Điểm tiêu chí' })
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @ApiPropertyOptional({ description: 'Nhận xét theo tiêu chí' })
  @Column({ type: 'text', nullable: true })
  comment?: string;

  @ManyToOne(() => GradingResultEntity, result => result.criterionScores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gradingResultId' })
  gradingResult?: GradingResultEntity;

  @ManyToOne(() => RubricCriterionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rubricCriterionId' })
  rubricCriterion?: RubricCriterionEntity;
}
