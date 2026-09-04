import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { LearningPathItemEntity } from './learning-path-item.entity';
import { UserLearningGoalEntity } from './user-learning-goal.entity';

/** Bảng `learning_paths` — lộ trình học được sinh ra từ một mục tiêu. */
@Entity('learning_paths')
@Index('idx_learning_paths_user', ['userId'])
@Index('idx_learning_paths_status', ['status'])
export class LearningPathEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người học' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến mục tiêu học' })
  @Column({ type: 'uuid' })
  goalId: string;

  @ApiProperty({ description: 'Số hiệu phiên bản lộ trình' })
  @Column({ type: 'int', default: 1 })
  pathVersion: number;

  @ApiProperty({
    enum: enumData.LEARNING_PATH_STATUS,
    default: enumData.LEARNING_PATH_STATUS.ACTIVE.code,
    description: 'Trạng thái lộ trình',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.LEARNING_PATH_STATUS.ACTIVE.code })
  status: string;

  @ApiProperty({
    enum: enumData.LEARNING_PATH_GENERATOR,
    default: enumData.LEARNING_PATH_GENERATOR.RULE_ENGINE.code,
    description: 'Cơ chế sinh lộ trình',
  })
  @Column({
    type: 'varchar',
    length: 20,
    default: enumData.LEARNING_PATH_GENERATOR.RULE_ENGINE.code,
  })
  generatedBy: string;

  @ApiPropertyOptional({ description: 'Thời điểm sinh lộ trình' })
  @Column({ type: 'timestamptz', nullable: true })
  generatedAt?: Date;

  @ManyToOne(() => UserLearningGoalEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goalId' })
  goal?: UserLearningGoalEntity;

  @OneToMany(() => LearningPathItemEntity, item => item.learningPath)
  items?: LearningPathItemEntity[];
}
