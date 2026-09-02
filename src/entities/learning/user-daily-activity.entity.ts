import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';

@Entity('user_daily_activity')
@Index('idx_user_daily_activity_unique', ['userId', 'activityDate'], { unique: true })
@Index('idx_user_daily_activity_date', ['activityDate'])
export class UserDailyActivityEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Ngày hoạt động' })
  @Column({ type: 'date' })
  activityDate: Date | string;

  @ApiProperty({ description: 'Số phút học', default: 0 })
  @Column({ type: 'int', default: 0 })
  studyMinutes: number;

  @ApiProperty({ description: 'Số bài học đã hoàn thành', default: 0 })
  @Column({ type: 'int', default: 0 })
  lessonsCompleted: number;

  @ApiProperty({ description: 'Số câu hỏi đã trả lời', default: 0 })
  @Column({ type: 'int', default: 0 })
  questionsAnswered: number;

  @ApiProperty({ description: 'Số câu hỏi trả lời đúng', default: 0 })
  @Column({ type: 'int', default: 0 })
  questionsCorrect: number;

  @ApiProperty({ description: 'Số từ vựng đã ôn tập', default: 0 })
  @Column({ type: 'int', default: 0 })
  vocabularyReviewed: number;

  @ApiProperty({ description: 'Số bài thi đã làm', default: 0 })
  @Column({ type: 'int', default: 0 })
  assessmentsAttempted: number;

  @ApiProperty({ description: 'Số trận đấu Arena đã tham gia', default: 0 })
  @Column({ type: 'int', default: 0 })
  arenaMatchesPlayed: number;

  @ApiProperty({ description: 'Số điểm tích lũy trong ngày', default: 0 })
  @Column({ type: 'int', default: 0 })
  pointsEarned: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
