import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSkillEntity } from '../exam/exam-skill.entity';

@Entity('leaderboard_snapshots')
@Index('idx_leaderboards_rank_lookup', ['boardType', 'period', 'periodKey', 'examSkillId', 'rank'])
@Index('idx_leaderboards_unique_user', ['boardType', 'period', 'periodKey', 'userId'], {
  unique: true,
})
@Index('idx_leaderboards_user_id', ['userId'])
export class LeaderboardSnapshotEntity extends PrimaryBaseEntity {
  @ApiProperty({
    enum: enumData.LEADERBOARD_BOARD_TYPE,
    description: 'Loại bảng xếp hạng (arena_elo, study_points, streak, exam_score)',
  })
  @Column({ type: 'varchar', length: 50, nullable: false })
  boardType: string;

  @ApiProperty({
    enum: enumData.LEADERBOARD_PERIOD,
    description: 'Kỳ bảng xếp hạng (daily, weekly, monthly, all_time)',
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  period: string;

  @ApiProperty({ description: 'Mã định danh kỳ (e.g. 2026-W35, 2026-08, ALL)' })
  @Column({ type: 'varchar', length: 20 })
  periodKey: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến kỹ năng kỳ thi' })
  @Column({ type: 'uuid', nullable: true })
  examSkillId?: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Thứ hạng xếp hạng' })
  @Column({ type: 'int' })
  rank: number;

  @ApiProperty({ description: 'Điểm số xếp hạng' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  score: number;

  @ApiPropertyOptional({ description: 'Dữ liệu metadata JSON bổ sung' })
  @Column({ type: 'jsonb', nullable: true })
  metadataJson?: Record<string, unknown>;

  @ApiProperty({ description: 'Thời điểm chụp bảng xếp hạng' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  snapshottedAt: Date;

  @ManyToOne(() => ExamSkillEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'examSkillId' })
  examSkill?: ExamSkillEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
