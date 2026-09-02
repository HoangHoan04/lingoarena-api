import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { VocabularyEntity } from './vocabulary.entity';

@Entity('vocabulary_review_logs')
@Index('idx_vocabulary_review_logs_user_id', ['userId'])
@Index('idx_vocabulary_review_logs_vocab_id', ['vocabularyId'])
@Index('idx_vocabulary_review_logs_reviewed_at', ['reviewedAt'])
export class VocabularyReviewLogEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ vựng' })
  @Column({ type: 'uuid' })
  vocabularyId: string;

  @ApiProperty({
    enum: enumData.FLASHCARD_RATING,
    description: 'Đánh giá mức độ nhớ flashcard (again, hard, good, easy)',
  })
  @Column({ type: 'varchar', length: 50 })
  rating: string;

  @ApiProperty({ description: 'Thời gian phản hồi tính bằng ms', default: 0 })
  @Column({ type: 'int', default: 0 })
  responseTimeMs: number;

  @ApiProperty({ description: 'Khoảng cách ngày ôn cũ' })
  @Column({ type: 'int' })
  oldIntervalDays: number;

  @ApiProperty({ description: 'Khoảng cách ngày ôn mới' })
  @Column({ type: 'int' })
  newIntervalDays: number;

  @ApiProperty({ description: 'Thời điểm ôn tập' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  reviewedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => VocabularyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vocabularyId' })
  vocabulary?: VocabularyEntity;
}
