import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { GradingResultCriterionScoreEntity } from './grading-result-criterion-score.entity';
import { GradingTaskEntity } from './grading-task.entity';

@Entity('grading_results')
@Index('idx_grading_results_task_id', ['gradingTaskId'])
@Index('idx_grading_results_grader_id', ['graderUserId'])
export class GradingResultEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến nhiệm vụ chấm điểm' })
  @Column({ type: 'uuid' })
  gradingTaskId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người chấm' })
  @Column({ type: 'uuid' })
  graderUserId: string;

  @ApiProperty({
    enum: enumData.GRADER_TYPE,
    default: enumData.GRADER_TYPE.TEACHER.code,
    description: 'Loại người chấm',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.GRADER_TYPE.TEACHER.code })
  graderType: string;

  @ApiProperty({ description: 'Tổng điểm đánh giá' })
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overallScore: number;

  @ApiPropertyOptional({ description: 'Điểm chi tiết theo từng tiêu chí JSON (tương thích cũ)' })
  @Column({ type: 'jsonb', nullable: true })
  criterionScoresJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Nhận xét tổng quát' })
  @Column({ type: 'text', nullable: true })
  generalFeedback?: string;

  @ApiPropertyOptional({ description: 'Nhận xét inline theo vị trí text JSON' })
  @Column({ type: 'jsonb', nullable: true })
  inlineFeedbackJson?: Record<string, unknown>;

  @ApiProperty({ description: 'Cờ kết quả cuối cùng', default: true })
  @Column({ type: 'boolean', default: true })
  isFinal: boolean;

  @ManyToOne(() => GradingTaskEntity, task => task.results, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gradingTaskId' })
  gradingTask?: GradingTaskEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'graderUserId' })
  grader?: UserEntity;

  @OneToMany(() => GradingResultCriterionScoreEntity, score => score.gradingResult)
  criterionScores?: GradingResultCriterionScoreEntity[];
}
