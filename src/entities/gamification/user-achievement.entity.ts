import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { AchievementEntity } from './achievement.entity';

@Entity('user_achievements')
@Index('idx_user_achievements_unique', ['userId', 'achievementId'], { unique: true })
@Index('idx_user_achievements_user_id', ['userId'])
export class UserAchievementEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến thành tích' })
  @Column({ type: 'uuid' })
  achievementId: string;

  @ApiProperty({ description: 'Thời điểm đạt được thành tích' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  earnedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => AchievementEntity, ach => ach.userAchievements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'achievementId' })
  achievement?: AchievementEntity;
}
