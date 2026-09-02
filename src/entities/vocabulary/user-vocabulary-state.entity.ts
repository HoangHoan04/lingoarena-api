import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { VocabularyEntity } from './vocabulary.entity';

@Entity('user_vocabulary_states')
@Index('idx_user_vocab_states_user_vocab', ['userId', 'vocabularyId'], { unique: true })
@Index('idx_user_vocab_states_user_next_review', ['userId', 'nextReviewAt'])
@Index('idx_user_vocab_states_user_id', ['userId'])
@Index('idx_user_vocab_states_vocabulary_id', ['vocabularyId'])
export class UserVocabularyStateEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ vựng' })
  @Column({ type: 'uuid' })
  vocabularyId: string;

  @ApiProperty({
    enum: enumData.VOCAB_SRS_STATE,
    default: enumData.VOCAB_SRS_STATE.LEARNING.code,
    description: 'Trạng thái học từ',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.VOCAB_SRS_STATE.LEARNING.code })
  state: string;

  @ApiProperty({ description: 'Tham số độ ổn định trí nhớ (SM-2/FSRS)', default: 0 })
  @Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
  stability: number;

  @ApiProperty({ description: 'Tham số độ khó từ', default: 5 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  difficulty: number;

  @ApiProperty({ description: 'Khoảng cách ngày ôn tập tiếp theo', default: 0 })
  @Column({ type: 'int', default: 0 })
  intervalDays: number;

  @ApiProperty({ description: 'Số lần lặp lại', default: 0 })
  @Column({ type: 'int', default: 0 })
  repetitionCount: number;

  @ApiProperty({ description: 'Số lần quên lapse', default: 0 })
  @Column({ type: 'int', default: 0 })
  lapseCount: number;

  @ApiPropertyOptional({ description: 'Thời điểm ôn tập gần nhất' })
  @Column({ type: 'timestamptz', nullable: true })
  lastReviewedAt?: Date;

  @ApiProperty({ description: 'Hạn ôn tập tiếp theo' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  nextReviewAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm tạm ngưng học từ' })
  @Column({ type: 'timestamptz', nullable: true })
  suspendedAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => VocabularyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vocabularyId' })
  vocabulary?: VocabularyEntity;
}
