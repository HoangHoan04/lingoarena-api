import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSkillEntity } from '../exam/exam-skill.entity';
import { ArenaMatchEntity } from './arena-match.entity';

@Entity('arena_queue_tickets')
@Index('idx_arena_queue_status_skill', ['status', 'examSkillId', 'matchMode'])
@Index('idx_arena_queue_user_id', ['userId'])
export class ArenaQueueTicketEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại người chơi' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại kỹ năng thi đấu' })
  @Column({ type: 'uuid' })
  examSkillId: string;

  @ApiProperty({
    enum: enumData.ARENA_MATCH_MODE,
    default: enumData.ARENA_MATCH_MODE.RANKED.code,
    description: 'Chế độ muốn ghép',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ARENA_MATCH_MODE.RANKED.code })
  matchMode: string;

  @ApiProperty({ description: 'ELO tại thời điểm vào hàng đợi' })
  @Column({ type: 'int' })
  eloAtEnqueue: number;

  @ApiProperty({
    enum: enumData.ARENA_QUEUE_STATUS,
    default: enumData.ARENA_QUEUE_STATUS.WAITING.code,
    description: 'Trạng thái ticket',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ARENA_QUEUE_STATUS.WAITING.code })
  status: string;

  @ApiProperty({ description: 'Thời điểm hết hạn ticket' })
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ApiPropertyOptional({ description: 'Trận đã ghép được' })
  @Column({ type: 'uuid', nullable: true })
  matchedMatchId?: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => ExamSkillEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examSkillId' })
  examSkill?: ExamSkillEntity;

  @ManyToOne(() => ArenaMatchEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'matchedMatchId' })
  matchedMatch?: ArenaMatchEntity;
}
