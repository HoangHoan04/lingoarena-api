import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamTypeEntity } from '../exam/exam-type.entity';

/** Bảng `user_learning_goals` — mục tiêu điểm của người học cho một kỳ thi. */
@Entity('user_learning_goals')
@Index('idx_user_learning_goals_user', ['userId'])
@Index('idx_user_learning_goals_current', ['userId', 'isCurrent'])
export class UserLearningGoalEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người học' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid' })
  examTypeId: string;

  @ApiPropertyOptional({ description: 'Điểm hiện tại (tự khai hoặc từ bài xếp lớp)' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  currentScore?: number;

  @ApiProperty({ description: 'Điểm mục tiêu (bắt buộc)' })
  @Column({ type: 'numeric', precision: 6, scale: 2 })
  targetScore: number;

  @ApiPropertyOptional({ description: 'Ngày dự kiến thi' })
  @Column({ type: 'date', nullable: true })
  examDate?: Date | string;

  @ApiProperty({ description: 'Số phút học mỗi ngày' })
  @Column({ type: 'int', default: 30 })
  minutesPerDay: number;

  @ApiProperty({ description: 'Số ngày học mỗi tuần' })
  @Column({ type: 'int', default: 5 })
  daysPerWeek: number;

  @ApiProperty({ description: 'Đây có phải mục tiêu đang theo đuổi' })
  @Column({ type: 'boolean', default: true })
  isCurrent: boolean;

  @ApiProperty({ description: 'Thời điểm bắt đầu' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm hoàn thành mục tiêu' })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;
}
