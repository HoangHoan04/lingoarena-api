import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';

/** Bảng `arena_queue_tickets` — vé chờ ghép trận. */
@Entity('arena_queue_tickets')
@Index('idx_arena_queue_tickets_matching', ['examStructureId', 'matchMode', 'status'])
@Index('idx_arena_queue_tickets_user', ['userId', 'status'])
export class ArenaQueueTicketEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người xếp hàng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Kỹ năng muốn đấu — node cấu trúc cấp SKILL' })
  @Column({ type: 'uuid' })
  examStructureId: string;

  @ApiProperty({ enum: enumData.ARENA_MATCH_MODE, description: 'Chế độ chơi muốn ghép' })
  @Column({ type: 'varchar', length: 20 })
  matchMode: string;

  @ApiProperty({
    enum: enumData.ARENA_QUEUE_STATUS,
    default: enumData.ARENA_QUEUE_STATUS.WAITING.code,
    description: 'Trạng thái vé chờ',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ARENA_QUEUE_STATUS.WAITING.code })
  status: string;

  @ApiPropertyOptional({ description: 'Trận được ghép vào' })
  @Column({ type: 'uuid', nullable: true })
  matchedMatchId?: string;

  @ApiProperty({ description: 'Thời điểm vào hàng chờ' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  enqueuedAt: Date;

  @ApiProperty({ description: 'Thời điểm vé chờ hết hạn' })
  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
