import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { UserLearningGoalEntity } from '../exam/user-learning-goal.entity';
import { LearningPathItemEntity } from './learning-path-item.entity';

@Entity('learning_paths')
@Index('idx_learning_paths_user_status', ['userId', 'status'])
@Index('idx_learning_paths_goal_id', ['goalId'])
export class LearningPathEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến mục tiêu học tập' })
  @Column({ type: 'uuid' })
  goalId: string;

  @ApiProperty({ description: 'Số phiên bản lộ trình', default: 1 })
  @Column({ type: 'int', default: 1 })
  version: number;

  @ApiProperty({
    enum: enumData.LEARNING_PATH_STATUS,
    default: enumData.LEARNING_PATH_STATUS.ACTIVE.code,
    description: 'Trạng thái lộ trình',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.LEARNING_PATH_STATUS.ACTIVE.code })
  status: string;

  @ApiPropertyOptional({
    enum: enumData.LEARNING_PATH_GENERATOR,
    default: enumData.LEARNING_PATH_GENERATOR.RULE_ENGINE.code,
    description: 'Cơ chế tạo lộ trình',
  })
  @Column({
    type: 'varchar',
    length: 50,
    default: enumData.LEARNING_PATH_GENERATOR.RULE_ENGINE.code,
  })
  generatedBy?: string;

  @ApiProperty({ description: 'Thời điểm tạo lộ trình' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  generatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => UserLearningGoalEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goalId' })
  goal?: UserLearningGoalEntity;

  @OneToMany(() => LearningPathItemEntity, item => item.learningPath)
  items?: LearningPathItemEntity[];
}
