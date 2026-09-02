import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseEntity } from './course.entity';

@Entity('course_enrollments')
@Index('idx_course_enrollments_user_course', ['userId', 'courseId'], { unique: true })
@Index('idx_course_enrollments_user_id', ['userId'])
@Index('idx_course_enrollments_course_id', ['courseId'])
@Index('idx_course_enrollments_status', ['status'])
export class CourseEnrollmentEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến khóa học' })
  @Column({ type: 'uuid' })
  courseId: string;

  @ApiProperty({
    description:
      'Nguồn cấp quyền ghi danh (subscription, onetime_purchase, classroom, admin_grant)',
  })
  @Column({ type: 'varchar', length: 50 })
  sourceType: string;

  @ApiPropertyOptional({ description: 'ID đơn hàng hoặc lớp học nguồn' })
  @Column({ type: 'uuid', nullable: true })
  sourceId?: string;

  @ApiProperty({
    enum: enumData.ENROLLMENT_STATUS,
    default: enumData.ENROLLMENT_STATUS.ACTIVE.code,
    description: 'Trạng thái ghi danh',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.ENROLLMENT_STATUS.ACTIVE.code })
  status: string;

  @ApiProperty({ description: 'Thời điểm ghi danh' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  enrolledAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm hết hạn quyền truy cập' })
  @Column({ type: 'timestamptz', nullable: true })
  accessExpiresAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => CourseEntity, course => course.enrollments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'courseId' })
  course?: CourseEntity;
}
