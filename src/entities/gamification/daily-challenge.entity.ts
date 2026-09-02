import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { UserDailyChallengeProgressEntity } from './user-daily-challenge-progress.entity';

@Entity('daily_challenges')
@Index('idx_daily_challenges_code', ['code'], { unique: true })
@Index('idx_daily_challenges_is_active', ['isActive'])
export class DailyChallengeEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã thử thách' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Tiêu đề' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ enum: enumData.DAILY_CHALLENGE_TYPE, description: 'Loại thử thách' })
  @Column({ type: 'varchar', length: 50 })
  challengeType: string;

  @ApiProperty({ description: 'Số lần cần hoàn thành trong ngày', default: 1 })
  @Column({ type: 'int', default: 1 })
  targetCount: number;

  @ApiProperty({ description: 'Điểm thưởng', default: 0 })
  @Column({ type: 'int', default: 0 })
  rewardPoints: number;

  @ApiProperty({ description: 'Đang mở', default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => UserDailyChallengeProgressEntity, progress => progress.dailyChallenge)
  progressRecords?: UserDailyChallengeProgressEntity[];
}
