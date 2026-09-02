import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSkillEntity } from '../exam/exam-skill.entity';
import { ArenaSeasonStandingEntity } from './arena-season-standing.entity';

@Entity('arena_seasons')
@Index('idx_arena_seasons_code', ['code'], { unique: true })
@Index('idx_arena_seasons_status', ['status'])
export class ArenaSeasonEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã mùa đấu' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Tên mùa đấu' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiPropertyOptional({ description: 'Kỹ năng áp dụng (null = mọi kỹ năng)' })
  @Column({ type: 'uuid', nullable: true })
  examSkillId?: string;

  @ApiProperty({ description: 'Thời điểm bắt đầu' })
  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @ApiProperty({ description: 'Thời điểm kết thúc' })
  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @ApiProperty({
    enum: enumData.ARENA_SEASON_STATUS,
    default: enumData.ARENA_SEASON_STATUS.UPCOMING.code,
    description: 'Trạng thái mùa',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ARENA_SEASON_STATUS.UPCOMING.code })
  status: string;

  @ApiProperty({ description: 'Reset ELO khi bắt đầu mùa', default: false })
  @Column({ type: 'boolean', default: false })
  resetElo: boolean;

  @ApiPropertyOptional({ description: 'Cấu hình phần thưởng JSON' })
  @Column({ type: 'jsonb', nullable: true })
  rewardJson?: Record<string, unknown>;

  @ManyToOne(() => ExamSkillEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'examSkillId' })
  examSkill?: ExamSkillEntity;

  @OneToMany(() => ArenaSeasonStandingEntity, standing => standing.season)
  standings?: ArenaSeasonStandingEntity[];
}
