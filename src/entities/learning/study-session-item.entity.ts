import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { StudySessionEntity } from './study-session.entity';

/**
 * Bảng `study_session_items` — từng lượt trả lời trong một phiên luyện.
 * Không ghi action log từng dòng (quyết định 9.4) — log ở mức phiên.
 */
@Entity('study_session_items')
@Index('idx_study_session_items_session', ['studySessionId', 'sortOrder'])
export class StudySessionItemEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phiên luyện' })
  @Column({ type: 'uuid' })
  studySessionId: string;

  @ApiProperty({ description: 'Loại đối tượng luyện (VOCABULARY, QUESTION, CONTENT_SEGMENT)' })
  @Column({ type: 'varchar', length: 30 })
  targetType: string;

  @ApiProperty({ description: 'ID đối tượng tương ứng với targetType' })
  @Column({ type: 'uuid' })
  targetId: string;

  @ApiProperty({ description: 'Thứ tự trong phiên' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Câu trả lời của người học' })
  @Column({ type: 'jsonb', nullable: true })
  answerJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Đúng hay sai' })
  @Column({ type: 'boolean', nullable: true })
  isCorrect?: boolean;

  @ApiPropertyOptional({
    enum: enumData.FLASHCARD_RATING,
    description: 'Người học tự đánh giá độ khó, dùng để tính lại SRS',
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  rating?: string;

  @ApiPropertyOptional({ description: 'Thời gian phản hồi (ms)' })
  @Column({ type: 'int', nullable: true })
  responseTimeMs?: number;

  @ManyToOne(() => StudySessionEntity, session => session.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studySessionId' })
  studySession?: StudySessionEntity;
}
