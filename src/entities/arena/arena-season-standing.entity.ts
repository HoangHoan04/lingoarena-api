import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSkillEntity } from '../exam/exam-skill.entity';
import { ArenaSeasonEntity } from './arena-season.entity';

@Entity('arena_season_standings')
@Index('uq_arena_season_standings', ['seasonId', 'userId', 'examSkillId'], { unique: true })
@Index('idx_arena_season_standings_rank', ['seasonId', 'examSkillId', 'eloRating'])
export class ArenaSeasonStandingEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại mùa đấu' })
  @Column({ type: 'uuid' })
  seasonId: string;

  @ApiProperty({ description: 'Khóa ngoại người chơi' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại kỹ năng' })
  @Column({ type: 'uuid' })
  examSkillId: string;

  @ApiProperty({ description: 'ELO trong mùa', default: 1000 })
  @Column({ type: 'int', default: 1000 })
  eloRating: number;

  @ApiProperty({ description: 'Số trận', default: 0 })
  @Column({ type: 'int', default: 0 })
  matchesPlayed: number;

  @ApiProperty({ description: 'Thắng', default: 0 })
  @Column({ type: 'int', default: 0 })
  wins: number;

  @ApiProperty({ description: 'Thua', default: 0 })
  @Column({ type: 'int', default: 0 })
  losses: number;

  @ApiProperty({ description: 'Hòa', default: 0 })
  @Column({ type: 'int', default: 0 })
  draws: number;

  @ApiProperty({ description: 'Điểm mùa (có thể khác ELO)', default: 0 })
  @Column({ type: 'int', default: 0 })
  points: number;

  @ApiPropertyOptional({ description: 'Hạng hiện tại' })
  @Column({ type: 'int', nullable: true })
  rank?: number;

  @ManyToOne(() => ArenaSeasonEntity, season => season.standings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seasonId' })
  season?: ArenaSeasonEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => ExamSkillEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examSkillId' })
  examSkill?: ExamSkillEntity;
}
