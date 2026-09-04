import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { AchievementEntity } from './achievement.entity';

/** Bảng `user_achievements` — huy hiệu người học đã đạt. */
@Entity('user_achievements')
@Index('uq_user_achievements_link', ['userId', 'achievementId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_user_achievements_user', ['userId'])
export class UserAchievementEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến huy hiệu' })
  @Column({ type: 'uuid' })
  achievementId: string;

  @ApiProperty({ description: 'Thời điểm đạt được' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  earnedAt: Date;

  @ApiPropertyOptional({ description: 'Tiến độ với huy hiệu nhiều bước' })
  @Column({ type: 'jsonb', nullable: true })
  progressJson?: Record<string, unknown>;

  @ManyToOne(() => AchievementEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'achievementId' })
  achievement?: AchievementEntity;
}
