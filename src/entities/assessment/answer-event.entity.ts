import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { AttemptAnswerEntity } from './attempt-answer.entity';

@Entity('answer_events')
@Index('idx_answer_events_answer_id', ['attemptAnswerId'])
@Index('idx_answer_events_occurred_at', ['occurredAt'])
export class AnswerEventEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu trả lời của thí sinh' })
  @Column({ type: 'uuid' })
  attemptAnswerId: string;

  @ApiProperty({
    description: 'Loại sự kiện (option_selected, text_changed, audio_uploaded, paste_detected)',
  })
  @Column({ type: 'varchar', length: 50 })
  eventType: string;

  @ApiPropertyOptional({ description: 'Dữ liệu payload JSON sự kiện' })
  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @ApiProperty({ description: 'Thời điểm xảy ra sự kiện' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  occurredAt: Date;

  @ManyToOne(() => AttemptAnswerEntity, answer => answer.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attemptAnswerId' })
  attemptAnswer?: AttemptAnswerEntity;
}
