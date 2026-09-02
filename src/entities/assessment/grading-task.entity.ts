import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { AiGradingLogEntity } from './ai-grading-log.entity';
import { AttemptAnswerEntity } from './attempt-answer.entity';
import { GradingResultEntity } from './grading-result.entity';
import { RubricEntity } from './rubric.entity';

@Entity('grading_tasks')
@Index('idx_grading_tasks_assigned_to', ['assignedToUserId'])
@Index('idx_grading_tasks_status', ['status'])
@Index('idx_grading_tasks_due_at', ['dueAt'])
export class GradingTaskEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu trả lời của thí sinh' })
  @Column({ type: 'uuid', unique: true })
  attemptAnswerId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến rubric' })
  @Column({ type: 'uuid' })
  rubricId: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến giáo viên chấm bài' })
  @Column({ type: 'uuid', nullable: true })
  assignedToUserId?: string;

  @ApiProperty({
    enum: enumData.GRADING_STATUS,
    default: enumData.GRADING_STATUS.PENDING.code,
    description: 'Trạng thái nhiệm vụ chấm',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.GRADING_STATUS.PENDING.code })
  status: string;

  @ApiProperty({ description: 'Độ ưu tiên', default: 0 })
  @Column({ type: 'int', default: 0 })
  priority: number;

  @ApiPropertyOptional({ description: 'Hạn chót hoàn thành chấm' })
  @Column({ type: 'timestamptz', nullable: true })
  dueAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm hoàn thành chấm' })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @OneToOne(() => AttemptAnswerEntity, answer => answer.gradingTask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attemptAnswerId' })
  attemptAnswer?: AttemptAnswerEntity;

  @ManyToOne(() => RubricEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rubricId' })
  rubric?: RubricEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTeacher?: UserEntity;

  @OneToMany(() => GradingResultEntity, result => result.gradingTask)
  results?: GradingResultEntity[];

  @OneToMany(() => AiGradingLogEntity, log => log.gradingTask)
  aiLogs?: AiGradingLogEntity[];
}
