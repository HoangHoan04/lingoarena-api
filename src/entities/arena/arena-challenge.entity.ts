import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';

/** Bảng `arena_challenges` — lời thách đấu giữa hai người chơi. */
@Entity('arena_challenges')
@Index('idx_arena_challenges_opponent', ['opponentUserId', 'status'])
@Index('idx_arena_challenges_challenger', ['challengerUserId', 'status'])
export class ArenaChallengeEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Người gửi lời thách đấu' })
  @Column({ type: 'uuid' })
  challengerUserId: string;

  @ApiProperty({ description: 'Người được thách đấu' })
  @Column({ type: 'uuid' })
  opponentUserId: string;

  @ApiProperty({ description: 'Kỹ năng thi đấu — node cấu trúc cấp SKILL' })
  @Column({ type: 'uuid' })
  examStructureId: string;

  @ApiPropertyOptional({ description: 'Lời nhắn kèm theo' })
  @Column({ type: 'text', nullable: true })
  message?: string;

  @ApiProperty({
    enum: enumData.ARENA_CHALLENGE_STATUS,
    default: enumData.ARENA_CHALLENGE_STATUS.PENDING.code,
    description: 'Trạng thái lời thách đấu',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ARENA_CHALLENGE_STATUS.PENDING.code })
  status: string;

  @ApiPropertyOptional({ description: 'Trận được tạo ra khi đối thủ chấp nhận' })
  @Column({ type: 'uuid', nullable: true })
  arenaMatchId?: string;

  @ApiProperty({ description: 'Thời điểm lời thách đấu hết hạn' })
  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
