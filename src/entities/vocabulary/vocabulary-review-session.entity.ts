import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { VocabularyDeckEntity } from './vocabulary-deck.entity';

@Entity('vocabulary_review_sessions')
@Index('idx_vocab_review_sessions_user_started', ['userId', 'startedAt'])
@Index('idx_vocab_review_sessions_status', ['status'])
export class VocabularyReviewSessionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiPropertyOptional({ description: 'Bộ thẻ đang ôn (null = due mix)' })
  @Column({ type: 'uuid', nullable: true })
  deckId?: string;

  @ApiProperty({
    enum: enumData.REVIEW_SESSION_STATUS,
    default: enumData.REVIEW_SESSION_STATUS.IN_PROGRESS.code,
    description: 'Trạng thái phiên ôn',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.REVIEW_SESSION_STATUS.IN_PROGRESS.code })
  status: string;

  @ApiProperty({ description: 'Số thẻ đến hạn khi bắt đầu', default: 0 })
  @Column({ type: 'int', default: 0 })
  cardsDue: number;

  @ApiProperty({ description: 'Số thẻ đã ôn', default: 0 })
  @Column({ type: 'int', default: 0 })
  cardsReviewed: number;

  @ApiProperty({ description: 'Số thẻ đánh giá Good/Easy', default: 0 })
  @Column({ type: 'int', default: 0 })
  cardsCorrect: number;

  @ApiProperty({ description: 'Thời điểm bắt đầu' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm kết thúc' })
  @Column({ type: 'timestamptz', nullable: true })
  endedAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => VocabularyDeckEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'deckId' })
  deck?: VocabularyDeckEntity;
}
