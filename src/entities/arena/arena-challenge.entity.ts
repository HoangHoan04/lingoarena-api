import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSkillEntity } from '../exam/exam-skill.entity';
import { ArenaMatchEntity } from './arena-match.entity';

@Entity('arena_challenges')
@Index('idx_arena_challenges_opponent_status', ['opponentUserId', 'status'])
@Index('idx_arena_challenges_challenger_id', ['challengerUserId'])
export class ArenaChallengeEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Người gửi lời thách đấu' })
  @Column({ type: 'uuid' })
  challengerUserId: string;

  @ApiProperty({ description: 'Người được thách' })
  @Column({ type: 'uuid' })
  opponentUserId: string;

  @ApiProperty({ description: 'Kỹ năng thi đấu' })
  @Column({ type: 'uuid' })
  examSkillId: string;

  @ApiProperty({
    enum: enumData.ARENA_CHALLENGE_STATUS,
    default: enumData.ARENA_CHALLENGE_STATUS.PENDING.code,
    description: 'Trạng thái lời mời',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ARENA_CHALLENGE_STATUS.PENDING.code })
  status: string;

  @ApiPropertyOptional({ description: 'Trận sau khi chấp nhận' })
  @Column({ type: 'uuid', nullable: true })
  matchId?: string;

  @ApiProperty({ description: 'Hết hạn lời mời' })
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ApiPropertyOptional({ description: 'Lời nhắn' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  message?: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challengerUserId' })
  challenger?: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opponentUserId' })
  opponent?: UserEntity;

  @ManyToOne(() => ExamSkillEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examSkillId' })
  examSkill?: ExamSkillEntity;

  @ManyToOne(() => ArenaMatchEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'matchId' })
  match?: ArenaMatchEntity;
}
