import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { VocabularyEntity } from '../vocabulary/vocabulary.entity';

/**
 * Bảng `user_vocabulary_states` — trạng thái SRS của người học với từng từ.
 *
 * Tách khỏi `user_mastery` (quyết định 9.1): đây là bảng lớn nhất hệ thống
 * (users × từ vựng) và truy vấn nóng nhất — mỗi phiên ôn lọc `nextReviewAt`.
 * Field FSRS không còn nullable vô nghĩa trên các loại mastery khác.
 */
@Entity('user_vocabulary_states')
@Index('uq_user_vocabulary_states_word', ['userId', 'vocabularyId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_user_vocabulary_states_due', ['userId', 'nextReviewAt'], {
  where: '"isDeleted" = false',
})
@Index('idx_user_vocabulary_states_srs', ['userId', 'srsState'])
export class UserVocabularyStateEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người học' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ vựng' })
  @Column({ type: 'uuid' })
  vocabularyId: string;

  @ApiProperty({
    enum: enumData.VOCAB_SRS_STATE,
    default: enumData.VOCAB_SRS_STATE.NEW.code,
    description: 'Trạng thái trong vòng lặp SRS',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.VOCAB_SRS_STATE.NEW.code })
  srsState: string;

  @ApiPropertyOptional({ description: 'Độ ổn định FSRS' })
  @Column({ type: 'numeric', precision: 8, scale: 4, nullable: true })
  stability?: number;

  @ApiPropertyOptional({ description: 'Độ khó FSRS' })
  @Column({ type: 'numeric', precision: 8, scale: 4, nullable: true })
  difficulty?: number;

  @ApiProperty({ description: 'Khoảng cách tới lần ôn kế tiếp (ngày)' })
  @Column({ type: 'int', default: 0 })
  intervalDays: number;

  @ApiProperty({ description: 'Số lần ôn liên tiếp' })
  @Column({ type: 'int', default: 0 })
  repetitionCount: number;

  @ApiProperty({ description: 'Số lần quên sau khi đã thuộc' })
  @Column({ type: 'int', default: 0 })
  lapseCount: number;

  @ApiProperty({ description: 'Số lần trả lời đúng' })
  @Column({ type: 'int', default: 0 })
  correctCount: number;

  @ApiProperty({ description: 'Số lần trả lời sai' })
  @Column({ type: 'int', default: 0 })
  incorrectCount: number;

  @ApiPropertyOptional({ description: 'Thời điểm ôn gần nhất' })
  @Column({ type: 'timestamptz', nullable: true })
  lastReviewedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm đến hạn ôn kế tiếp' })
  @Column({ type: 'timestamptz', nullable: true })
  nextReviewAt?: Date;

  @ApiPropertyOptional({ description: 'Tạm ẩn từ khỏi hàng ôn' })
  @Column({ type: 'timestamptz', nullable: true })
  suspendedAt?: Date;

  @ApiProperty({ description: 'Đánh dấu sổ tay /vocabulary/notebook' })
  @Column({ type: 'boolean', default: false })
  isSaved: boolean;

  @ApiPropertyOptional({ description: 'Ghi chú cá nhân' })
  @Column({ type: 'text', nullable: true })
  noteText?: string;

  @ManyToOne(() => VocabularyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vocabularyId' })
  vocabulary?: VocabularyEntity;
}
