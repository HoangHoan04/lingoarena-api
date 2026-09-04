import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { DailyChallengeEntity } from './daily-challenge.entity';

/** Bảng `user_daily_challenge_progress` — tiến độ của người học với thử thách ngày. */
@Entity('user_daily_challenge_progress')
@Index('uq_user_daily_challenge_progress_link', ['userId', 'dailyChallengeId'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class UserDailyChallengeProgressEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến thử thách ngày' })
  @Column({ type: 'uuid' })
  dailyChallengeId: string;

  @ApiProperty({ description: 'Số lượng đã đạt' })
  @Column({ type: 'int', default: 0 })
  progressCount: number;

  @ApiPropertyOptional({ description: 'Thời điểm hoàn thành' })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @ApiProperty({ description: 'Điểm đã được cộng, tránh cộng trùng' })
  @Column({ type: 'int', default: 0 })
  pointsAwarded: number;

  @ManyToOne(() => DailyChallengeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dailyChallengeId' })
  dailyChallenge?: DailyChallengeEntity;
}
