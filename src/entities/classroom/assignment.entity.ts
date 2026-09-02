import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { AssignmentSubmissionEntity } from './assignment-submission.entity';
import { ClassroomEntity } from './classroom.entity';

@Entity('assignments')
@Index('idx_assignments_classroom_id', ['classroomId'])
@Index('idx_assignments_due_at', ['dueAt'])
export class AssignmentEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến lớp học' })
  @Column({ type: 'uuid' })
  classroomId: string;

  @ApiProperty({ description: 'Tiêu đề bài tập' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết bài tập' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ enum: enumData.ASSIGNMENT_TYPE, description: 'Loại bài tập' })
  @Column({ type: 'varchar', length: 50 })
  assignmentType: string;

  @ApiProperty({
    description: 'Khóa ngoại tham chiếu đến tài nguyên giao (Assessment ID, Lesson ID, Deck ID)',
  })
  @Column({ type: 'uuid' })
  resourceId: string;

  @ApiProperty({ description: 'Hạn chót nộp bài' })
  @Column({ type: 'timestamptz' })
  dueAt: Date;

  @ApiPropertyOptional({ description: 'Điểm tối đa', default: 100 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  maxScore?: number;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến giáo viên giao bài' })
  @Column({ type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => ClassroomEntity, classroom => classroom.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classroomId' })
  classroom?: ClassroomEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser?: UserEntity;

  @OneToMany(() => AssignmentSubmissionEntity, submission => submission.assignment)
  submissions?: AssignmentSubmissionEntity[];
}
