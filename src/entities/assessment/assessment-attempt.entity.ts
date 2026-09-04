import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { AssessmentEntity } from './assessment.entity';
import { AttemptQuestionEntity } from './attempt-question.entity';

/**
 * Bảng `assessment_attempts` — một lượt làm đề của người học.
 *
 * `expiresAt` là **bắt buộc** và tính ở server để chống làm quá giờ; không tin
 * đồng hồ máy khách.
 *
 * Action log ghi ở mức bảng này (1 dòng khi submit) thay vì từng
 * `attempt_answers`, theo quyết định 9.4.
 */
@Entity('assessment_attempts')
@Index('uq_assessment_attempts_number', ['assessmentId', 'userId', 'attemptNumber'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_assessment_attempts_user', ['userId'])
@Index('idx_assessment_attempts_status', ['status'])
export class AssessmentAttemptEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến đề thi' })
  @Column({ type: 'uuid' })
  assessmentId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người làm bài' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Lượt làm thứ mấy' })
  @Column({ type: 'int', default: 1 })
  attemptNumber: number;

  @ApiProperty({
    enum: enumData.ATTEMPT_STATUS,
    default: enumData.ATTEMPT_STATUS.IN_PROGRESS.code,
    description: 'Trạng thái lượt làm',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ATTEMPT_STATUS.IN_PROGRESS.code })
  status: string;

  @ApiProperty({ description: 'Thời điểm bắt đầu' })
  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @ApiProperty({ description: 'Thời điểm hết hạn, tính ở server (bắt buộc)' })
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm nộp bài' })
  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @ApiPropertyOptional({ description: 'Điểm phần chấm tự động' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  objectiveScore?: number;

  @ApiPropertyOptional({ description: 'Điểm phần chấm chủ quan (AI / giáo viên)' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  subjectiveScore?: number;

  @ApiPropertyOptional({ description: 'Tổng điểm thô' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  totalScore?: number;

  @ApiPropertyOptional({ description: 'Điểm quy đổi theo scoreSchema của kỳ thi' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  convertedScore?: number;

  @ApiProperty({
    enum: enumData.GRADING_STATUS,
    default: enumData.GRADING_STATUS.PENDING.code,
    description: 'Trạng thái chấm bài',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.GRADING_STATUS.PENDING.code })
  gradingStatus: string;

  @ApiPropertyOptional({ description: 'Báo cáo kết quả đã dựng sẵn để render nhanh' })
  @Column({ type: 'jsonb', nullable: true })
  resultJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Nhịp tim gần nhất từ máy khách' })
  @Column({ type: 'timestamptz', nullable: true })
  lastHeartbeatAt?: Date;

  @ApiProperty({ description: 'Số lần rời khỏi tab khi đang thi' })
  @Column({ type: 'int', default: 0 })
  focusLossCount: number;

  @ApiPropertyOptional({ description: 'Thông tin máy khách khi làm bài' })
  @Column({ type: 'jsonb', nullable: true })
  clientMetadataJson?: Record<string, unknown>;

  @ManyToOne(() => AssessmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessmentId' })
  assessment?: AssessmentEntity;

  @OneToMany(() => AttemptQuestionEntity, question => question.attempt)
  attemptQuestions?: AttemptQuestionEntity[];
}
