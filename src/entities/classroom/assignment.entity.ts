import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { AssignmentSubmissionEntity } from './assignment-submission.entity';
import { ClassroomEntity } from './classroom.entity';

/**
 * Bảng `assignments` — bài tập giáo viên giao trong lớp.
 * File đề bài (N file) gắn qua `media_attachments`.
 */
@Entity('assignments')
@Index('idx_assignments_classroom', ['classroomId'])
@Index('idx_assignments_due_at', ['dueAt'])
export class AssignmentEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến lớp học' })
  @Column({ type: 'uuid' })
  classroomId: string;

  @ApiProperty({ description: 'Tiêu đề bài tập' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả / hướng dẫn' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ enum: enumData.ASSIGNMENT_TYPE, description: 'Loại bài tập' })
  @Column({ type: 'varchar', length: 30 })
  assignmentType: string;

  @ApiPropertyOptional({
    description: 'ID tài nguyên gắn kèm (đề thi / bài học / bộ từ) tùy assignmentType',
  })
  @Column({ type: 'uuid', nullable: true })
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Hạn nộp' })
  @Column({ type: 'timestamptz', nullable: true })
  dueAt?: Date;

  @ApiPropertyOptional({ description: 'Điểm tối đa' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  maxScore?: number;

  @ApiProperty({ description: 'Người tạo bài tập' })
  @Column({ type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => ClassroomEntity, classroom => classroom.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classroomId' })
  classroom?: ClassroomEntity;

  @OneToMany(() => AssignmentSubmissionEntity, submission => submission.assignment)
  submissions?: AssignmentSubmissionEntity[];
}
