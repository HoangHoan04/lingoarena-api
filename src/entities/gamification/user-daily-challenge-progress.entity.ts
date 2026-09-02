import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { DailyChallengeEntity } from './daily-challenge.entity';

@Entity('user_daily_challenge_progress')
@Index('uq_user_daily_challenge_date', ['userId', 'dailyChallengeId', 'activityDate'], {
  unique: true,
})
@Index('idx_user_daily_challenge_user_date', ['userId', 'activityDate'])
export class UserDailyChallengeProgressEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại thử thách' })
  @Column({ type: 'uuid' })
  dailyChallengeId: string;

  @ApiProperty({ description: 'Ngày thử thách' })
  @Column({ type: 'date' })
  activityDate: Date | string;

  @ApiProperty({ description: 'Tiến độ hiện tại', default: 0 })
  @Column({ type: 'int', default: 0 })
  progressCount: number;

  @ApiProperty({ description: 'Mục tiêu snapshot trong ngày', default: 1 })
  @Column({ type: 'int', default: 1 })
  targetCount: number;

  @ApiPropertyOptional({ description: 'Thời điểm hoàn thành' })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @ApiProperty({ description: 'Điểm đã cộng', default: 0 })
  @Column({ type: 'int', default: 0 })
  pointsAwarded: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => DailyChallengeEntity, challenge => challenge.progressRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dailyChallengeId' })
  dailyChallenge?: DailyChallengeEntity;
}
