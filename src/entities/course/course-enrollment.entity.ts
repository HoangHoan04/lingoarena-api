import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseEntity } from './course.entity';

/** Bảng `course_enrollments` — người học đăng ký khóa học. */
@Entity('course_enrollments')
@Index('uq_course_enrollments_user_course', ['userId', 'courseId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_course_enrollments_user', ['userId'])
export class CourseEnrollmentEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người học' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến khóa học' })
  @Column({ type: 'uuid' })
  courseId: string;

  @ApiPropertyOptional({
    description: 'Nguồn đăng ký (order, subscription, classroom, manual_grant)',
  })
  @Column({ type: 'varchar', length: 30, nullable: true })
  sourceType?: string;

  @ApiProperty({
    enum: enumData.ENROLLMENT_STATUS,
    default: enumData.ENROLLMENT_STATUS.NOT_STARTED.code,
    description: 'Trạng thái học',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ENROLLMENT_STATUS.NOT_STARTED.code })
  status: string;

  @ApiProperty({ description: 'Phần trăm hoàn thành khóa' })
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  progressPercent: number;

  @ApiProperty({ description: 'Thời điểm đăng ký' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  enrolledAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm hoàn thành khóa' })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @ManyToOne(() => CourseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course?: CourseEntity;
}
