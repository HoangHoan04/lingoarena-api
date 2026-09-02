import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseEntity } from './course.entity';

@Entity('course_instructors')
@Index('idx_course_instructors_course_user', ['courseId', 'userId'], { unique: true })
export class CourseInstructorEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến khóa học' })
  @Column({ type: 'uuid' })
  courseId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng giảng viên' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiPropertyOptional({
    description: 'Vai trò giảng viên (lead_instructor, tutor, assistant)',
    default: 'lead_instructor',
  })
  @Column({ type: 'varchar', length: 50, default: 'lead_instructor' })
  role?: string;

  @ApiProperty({ description: 'Thời điểm phân công' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @ManyToOne(() => CourseEntity, course => course.instructors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course?: CourseEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
