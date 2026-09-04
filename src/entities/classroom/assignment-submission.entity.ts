import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { AssignmentEntity } from './assignment.entity';

/**
 * Bảng `assignment_submissions` — bài nộp của học viên.
 * File bài làm (N file) gắn qua `media_attachments`.
 */
@Entity('assignment_submissions')
@Index('uq_assignment_submissions_link', ['assignmentId', 'userId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_assignment_submissions_user', ['userId'])
export class AssignmentSubmissionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến bài tập' })
  @Column({ type: 'uuid' })
  assignmentId: string;

  @ApiProperty({ description: 'Học viên nộp bài' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiPropertyOptional({ description: 'Lượt thi gắn kèm nếu bài tập là đề thi' })
  @Column({ type: 'uuid', nullable: true })
  assessmentAttemptId?: string;

  @ApiProperty({
    enum: enumData.ASSIGNMENT_SUBMISSION_STATUS,
    default: enumData.ASSIGNMENT_SUBMISSION_STATUS.SUBMITTED.code,
    description: 'Trạng thái bài nộp',
  })
  @Column({
    type: 'varchar',
    length: 20,
    default: enumData.ASSIGNMENT_SUBMISSION_STATUS.SUBMITTED.code,
  })
  status: string;

  @ApiPropertyOptional({ description: 'Nội dung nộp dạng chữ' })
  @Column({ type: 'text', nullable: true })
  contentText?: string;

  @ApiPropertyOptional({ description: 'Điểm giáo viên chấm' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  score?: number;

  @ApiPropertyOptional({ description: 'Nhận xét của giáo viên' })
  @Column({ type: 'text', nullable: true })
  teacherFeedback?: string;

  @ApiPropertyOptional({ description: 'Thời điểm nộp' })
  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm chấm' })
  @Column({ type: 'timestamptz', nullable: true })
  gradedAt?: Date;

  @ManyToOne(() => AssignmentEntity, assignment => assignment.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignmentId' })
  assignment?: AssignmentEntity;
}
