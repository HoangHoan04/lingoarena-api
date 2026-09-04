import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';

/**
 * Bảng `user_error_items` — sổ tay lỗi của người học, nguồn cho tính năng ôn lỗi.
 *
 * `sourceType` + `sourceId` trỏ về nơi phát sinh lỗi (attempt answer, session
 * item, answer evaluation) để người học bấm vào xem lại ngữ cảnh.
 */
@Entity('user_error_items')
@Index('idx_user_error_items_user', ['userId'])
@Index('idx_user_error_items_unresolved', ['userId', 'isResolved'])
@Index('idx_user_error_items_error_type', ['userId', 'errorType'])
export class UserErrorItemEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người học' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: enumData.ERROR_TYPE, description: 'Loại lỗi' })
  @Column({ type: 'varchar', length: 30 })
  errorType: string;

  @ApiPropertyOptional({ description: 'Loại nguồn phát sinh lỗi' })
  @Column({ type: 'varchar', length: 30, nullable: true })
  sourceType?: string;

  @ApiPropertyOptional({ description: 'ID nguồn tương ứng với sourceType' })
  @Column({ type: 'uuid', nullable: true })
  sourceId?: string;

  @ApiPropertyOptional({ description: 'Câu hỏi liên quan' })
  @Column({ type: 'uuid', nullable: true })
  questionId?: string;

  @ApiPropertyOptional({ description: 'Cấu trúc ngữ pháp liên quan' })
  @Column({ type: 'uuid', nullable: true })
  grammarStructureId?: string;

  @ApiPropertyOptional({ description: 'Từ vựng liên quan' })
  @Column({ type: 'uuid', nullable: true })
  vocabularyId?: string;

  @ApiProperty({ description: 'Mô tả lỗi' })
  @Column({ type: 'text' })
  description: string;

  @ApiPropertyOptional({ description: 'Đoạn văn bản người học viết sai' })
  @Column({ type: 'text', nullable: true })
  wrongText?: string;

  @ApiPropertyOptional({ description: 'Bản sửa đúng' })
  @Column({ type: 'text', nullable: true })
  correctedText?: string;

  @ApiProperty({ description: 'Số lần lặp lại cùng lỗi' })
  @Column({ type: 'int', default: 1 })
  occurrenceCount: number;

  @ApiProperty({ description: 'Đã khắc phục hay chưa' })
  @Column({ type: 'boolean', default: false })
  isResolved: boolean;

  @ApiProperty({ description: 'Thời điểm gặp lỗi gần nhất' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastOccurredAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm đánh dấu đã khắc phục' })
  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date;
}
