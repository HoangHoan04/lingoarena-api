import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';

/**
 * Bảng `user_daily_activities` — tổng hợp hoạt động theo ngày.
 *
 * Bảng đọc được dựng sẵn cho heatmap và streak trên dashboard. Cố tình
 * denormalize: tính lại từ `study_sessions` + `assessment_attempts` mỗi lần vào
 * dashboard sẽ quá nặng.
 *
 * `activityDate` lưu theo **timezone của người dùng**, không phải UTC, để streak
 * không bị đứt oan khi học buổi tối.
 */
@Entity('user_daily_activities')
@Index('uq_user_daily_activities_date', ['userId', 'activityDate'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_user_daily_activities_user_date', ['userId', 'activityDate'])
export class UserDailyActivityEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người học' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Ngày hoạt động, theo timezone của người dùng' })
  @Column({ type: 'date' })
  activityDate: Date | string;

  @ApiProperty({ description: 'Tổng số phút học trong ngày' })
  @Column({ type: 'int', default: 0 })
  studyMinutes: number;

  @ApiProperty({ description: 'Số từ đã ôn' })
  @Column({ type: 'int', default: 0 })
  vocabReviewed: number;

  @ApiProperty({ description: 'Số bài học hoàn thành' })
  @Column({ type: 'int', default: 0 })
  lessonsCompleted: number;

  @ApiProperty({ description: 'Số câu hỏi đã làm' })
  @Column({ type: 'int', default: 0 })
  questionsAnswered: number;

  @ApiProperty({ description: 'Số trận arena đã đấu' })
  @Column({ type: 'int', default: 0 })
  arenaMatches: number;

  @ApiProperty({ description: 'Điểm kiếm được trong ngày' })
  @Column({ type: 'int', default: 0 })
  pointsEarned: number;

  @ApiProperty({ description: 'Chuỗi ngày học liên tiếp tính đến ngày này' })
  @Column({ type: 'int', default: 0 })
  streakCount: number;

  @ApiProperty({ description: 'Ngày này có đạt mục tiêu học hay không' })
  @Column({ type: 'boolean', default: false })
  goalMet: boolean;
}
