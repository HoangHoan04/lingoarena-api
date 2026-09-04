import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { StudySessionItemEntity } from './study-session-item.entity';

/**
 * Bảng `study_sessions` — phiên luyện tập nhẹ (flashcard, dictation, đọc, quiz, game).
 * Đề thi có cấu trúc dùng `assessment_attempts`, không dùng bảng này.
 *
 * Ghi 1 dòng action log cho cả phiên khi kết thúc (quyết định 9.4).
 */
@Entity('study_sessions')
@Index('idx_study_sessions_user_type', ['userId', 'sessionType'])
@Index('idx_study_sessions_started', ['userId', 'startedAt'])
export class StudySessionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người học' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: enumData.STUDY_SESSION_TYPE, description: 'Loại phiên luyện' })
  @Column({ type: 'varchar', length: 30 })
  sessionType: string;

  @ApiPropertyOptional({ description: 'Bộ từ nếu phiên thuộc một deck' })
  @Column({ type: 'uuid', nullable: true })
  deckId?: string;

  @ApiPropertyOptional({ description: 'Nhóm câu hỏi nếu phiên là đọc / nghe chép' })
  @Column({ type: 'uuid', nullable: true })
  questionGroupId?: string;

  @ApiProperty({
    enum: enumData.REVIEW_SESSION_STATUS,
    default: enumData.REVIEW_SESSION_STATUS.IN_PROGRESS.code,
    description: 'Trạng thái phiên',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.REVIEW_SESSION_STATUS.IN_PROGRESS.code })
  status: string;

  @ApiPropertyOptional({
    enum: enumData.VOCAB_STUDY_MODE,
    description: 'Chế độ luyện với phiên từ vựng',
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  studyMode?: string;

  @ApiProperty({ description: 'Tổng số item trong phiên' })
  @Column({ type: 'int', default: 0 })
  totalItems: number;

  @ApiProperty({ description: 'Số item đã hoàn thành' })
  @Column({ type: 'int', default: 0 })
  completedItems: number;

  @ApiProperty({ description: 'Số item làm đúng' })
  @Column({ type: 'int', default: 0 })
  correctItems: number;

  @ApiPropertyOptional({ description: 'Điểm của phiên' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  score?: number;

  @ApiProperty({ description: 'Tổng thời gian làm (giây)' })
  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @ApiPropertyOptional({ description: 'Tốc độ đọc (từ/phút) — trang /reading' })
  @Column({ type: 'int', nullable: true })
  wordsPerMinute?: number;

  @ApiProperty({ description: 'Thời điểm bắt đầu' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm kết thúc' })
  @Column({ type: 'timestamptz', nullable: true })
  endedAt?: Date;

  @ApiPropertyOptional({ description: 'Cấu hình phiên (độ khó dictation, tuỳ chọn game)' })
  @Column({ type: 'jsonb', nullable: true })
  configJson?: Record<string, unknown>;

  @OneToMany(() => StudySessionItemEntity, item => item.studySession)
  items?: StudySessionItemEntity[];
}
