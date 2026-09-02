import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { AssessmentAttemptEntity } from '../assessment/assessment-attempt.entity';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { AssignmentEntity } from './assignment.entity';

@Entity('assignment_submissions')
@Index('idx_assignment_subs_assign_user', ['assignmentId', 'userId'], { unique: true })
@Index('idx_assignment_subs_assignment_id', ['assignmentId'])
@Index('idx_assignment_subs_user_id', ['userId'])
export class AssignmentSubmissionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến bài tập' })
  @Column({ type: 'uuid' })
  assignmentId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến học sinh nộp bài' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiPropertyOptional({
    description: 'Khóa ngoại tham chiếu đến lượt làm bài thi nếu bài tập dạng đề thi',
  })
  @Column({ type: 'uuid', nullable: true })
  attemptId?: string;

  @ApiProperty({
    enum: enumData.ASSIGNMENT_SUBMISSION_STATUS,
    default: enumData.ASSIGNMENT_SUBMISSION_STATUS.SUBMITTED.code,
    description: 'Trạng thái nộp bài',
  })
  @Column({
    type: 'varchar',
    length: 20,
    default: enumData.ASSIGNMENT_SUBMISSION_STATUS.SUBMITTED.code,
  })
  status: string;

  @ApiProperty({ description: 'Thời điểm nộp bài' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;

  @ApiPropertyOptional({ description: 'Điểm số đạt được' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score?: number;

  @ApiPropertyOptional({ description: 'Nhận xét của giáo viên' })
  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến giáo viên chấm bài' })
  @Column({ type: 'uuid', nullable: true })
  gradedByUserId?: string;

  @ApiPropertyOptional({ description: 'Thời điểm chấm bài' })
  @Column({ type: 'timestamptz', nullable: true })
  gradedAt?: Date;

  @ManyToOne(() => AssignmentEntity, assignment => assignment.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignmentId' })
  assignment?: AssignmentEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => AssessmentAttemptEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'attemptId' })
  attempt?: AssessmentAttemptEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'gradedByUserId' })
  gradedByTeacher?: UserEntity;
}
