import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSkillEntity } from './exam-skill.entity';

@Entity('user_skill_levels')
@Index('idx_user_skill_levels_pk', ['userId', 'examSkillId'], { unique: true })
export class UserSkillLevelEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến kỹ năng kỳ thi' })
  @Column({ type: 'uuid' })
  examSkillId: string;

  @ApiProperty({ description: 'Điểm ước tính', default: 0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  estimatedScore: number;

  @ApiProperty({ description: 'Điểm thành thạo (0.00 to 100.00%)', default: 0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  masteryScore: number;

  @ApiProperty({ description: 'Độ tin cậy (0.00 to 1.00)', default: 0.5 })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.5 })
  confidenceScore: number;

  @ApiProperty({ description: 'Thời điểm đánh giá gần nhất' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastEvaluatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => ExamSkillEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examSkillId' })
  examSkill?: ExamSkillEntity;
}
