import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamTypeEntity } from './exam-type.entity';

@Entity('user_learning_goals')
@Index('idx_user_learning_goals_user_current', ['userId', 'isCurrent'])
@Index('idx_user_learning_goals_user_id', ['userId'])
@Index('idx_user_learning_goals_exam_type_id', ['examTypeId'])
export class UserLearningGoalEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid' })
  examTypeId: string;

  @ApiPropertyOptional({ description: 'Điểm hiện tại' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  currentScore?: number;

  @ApiProperty({ description: 'Điểm mục tiêu' })
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  targetScore: number;

  @ApiPropertyOptional({ description: 'Ngày thi dự kiến' })
  @Column({ type: 'date', nullable: true })
  examDate?: Date | string;

  @ApiProperty({ description: 'Số phút học mỗi ngày', default: 30 })
  @Column({ type: 'int', default: 30 })
  minutesPerDay: number;

  @ApiProperty({ description: 'Số ngày học mỗi tuần', default: 5 })
  @Column({ type: 'int', default: 5 })
  daysPerWeek: number;

  @ApiProperty({ description: 'Cờ xác định mục tiêu hiện tại', default: true })
  @Column({ type: 'boolean', default: true })
  isCurrent: boolean;

  @ApiProperty({ description: 'Thời điểm bắt đầu' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm hoàn thành' })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;
}
