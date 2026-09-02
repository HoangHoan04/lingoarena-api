import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { AssessmentEntity } from './assessment.entity';
import { AttemptQuestionEntity } from './attempt-question.entity';
import { AttemptSectionEntity } from './attempt-section.entity';

@Entity('assessment_attempts')
@Index('idx_assessment_attempts_unique', ['assessmentId', 'userId', 'attemptNumber'], {
  unique: true,
})
@Index('idx_assessment_attempts_user_status_started', ['userId', 'status', 'startedAt'])
@Index('idx_assessment_attempts_user_id', ['userId'])
@Index('idx_assessment_attempts_assessment_id', ['assessmentId'])
@Index('idx_assessment_attempts_status', ['status'])
export class AssessmentAttemptEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến bài đánh giá' })
  @Column({ type: 'uuid' })
  assessmentId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Số thứ tự lượt làm bài', default: 1 })
  @Column({ type: 'int', default: 1 })
  attemptNumber: number;

  @ApiProperty({
    enum: enumData.ATTEMPT_STATUS,
    default: enumData.ATTEMPT_STATUS.IN_PROGRESS.code,
    description: 'Trạng thái lượt làm bài',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ATTEMPT_STATUS.IN_PROGRESS.code })
  status: string;

  @ApiProperty({ description: 'Thời điểm bắt đầu' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @ApiProperty({ description: 'Thời điểm hết hạn làm bài' })
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm nộp bài' })
  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @ApiPropertyOptional({ description: 'Điểm trắc nghiệm khách quan', default: 0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  objectiveScore?: number;

  @ApiPropertyOptional({ description: 'Điểm tự luận chủ quan', default: 0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  subjectiveScore?: number;

  @ApiPropertyOptional({ description: 'Tổng điểm', default: 0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  totalScore?: number;

  @ApiPropertyOptional({ description: 'Điểm quy đổi (TOEIC 860, IELTS 7.5)' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  convertedScore?: number;

  @ApiPropertyOptional({ description: 'Kết quả chi tiết dạng JSON' })
  @Column({ type: 'jsonb', nullable: true })
  resultJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Metadata client JSON (IP, User Agent, Screen stats)' })
  @Column({ type: 'jsonb', nullable: true })
  clientMetadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Heartbeat gần nhất từ client (server-authoritative timer)' })
  @Column({ type: 'timestamptz', nullable: true })
  lastHeartbeatAt?: Date;

  @ApiProperty({ description: 'Số lần mất focus cửa sổ thi', default: 0 })
  @Column({ type: 'int', default: 0 })
  focusLossCount: number;

  @ApiPropertyOptional({ description: 'Độ lệch đồng hồ client so với server (ms)' })
  @Column({ type: 'int', nullable: true })
  clientClockSkewMs?: number;

  @ManyToOne(() => AssessmentEntity, assessment => assessment.attempts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assessmentId' })
  assessment?: AssessmentEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @OneToMany(() => AttemptSectionEntity, section => section.attempt)
  attemptSections?: AttemptSectionEntity[];

  @OneToMany(() => AttemptQuestionEntity, question => question.attempt)
  attemptQuestions?: AttemptQuestionEntity[];
}
