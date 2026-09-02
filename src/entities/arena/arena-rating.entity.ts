import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSkillEntity } from '../exam/exam-skill.entity';

@Entity('arena_ratings')
@Index('idx_arena_ratings_user_skill', ['userId', 'examSkillId'], { unique: true })
@Index('idx_arena_ratings_skill_elo', ['examSkillId', 'eloRating'])
export class ArenaRatingEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến kỹ năng kỳ thi' })
  @Column({ type: 'uuid' })
  examSkillId: string;

  @ApiProperty({ description: 'Điểm xếp hạng ELO', default: 1000 })
  @Column({ type: 'int', default: 1000 })
  eloRating: number;

  @ApiProperty({ description: 'Điểm ELO cao nhất từng đạt', default: 1000 })
  @Column({ type: 'int', default: 1000 })
  peakElo: number;

  @ApiProperty({ description: 'Số trận đã đấu', default: 0 })
  @Column({ type: 'int', default: 0 })
  matchesPlayed: number;

  @ApiProperty({ description: 'Số trận thắng', default: 0 })
  @Column({ type: 'int', default: 0 })
  wins: number;

  @ApiProperty({ description: 'Số trận thua', default: 0 })
  @Column({ type: 'int', default: 0 })
  losses: number;

  @ApiProperty({ description: 'Số trận hòa', default: 0 })
  @Column({ type: 'int', default: 0 })
  draws: number;

  @ApiPropertyOptional({ description: 'Thời điểm trận đấu gần nhất' })
  @Column({ type: 'timestamptz', nullable: true })
  lastMatchAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => ExamSkillEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examSkillId' })
  examSkill?: ExamSkillEntity;
}
