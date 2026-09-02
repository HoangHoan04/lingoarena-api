import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamTypeEntity } from '../exam/exam-type.entity';
import { CourseEnrollmentEntity } from './course-enrollment.entity';
import { CourseInstructorEntity } from './course-instructor.entity';
import { CourseReviewEntity } from './course-review.entity';
import { CourseVersionEntity } from './course-version.entity';

@Entity('courses')
@Index('idx_courses_slug', ['slug'], { unique: true })
@Index('idx_courses_exam_type_id', ['examTypeId'])
@Index('idx_courses_status', ['status'])
export class CourseEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid', nullable: true })
  examTypeId?: string;

  @ApiProperty({ description: 'Mã nghiệp vụ khóa học' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Chuỗi thân thiện với URL và duy nhất' })
  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @ApiProperty({ description: 'Tiêu đề khóa học' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả ngắn' })
  @Column({ type: 'text', nullable: true })
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn thumbnail' })
  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    enum: enumData.CEFR_LEVEL,
    default: enumData.CEFR_LEVEL.A1,
    description: 'Trình độ đầu vào',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.CEFR_LEVEL.A1.code })
  levelFrom?: string;

  @ApiPropertyOptional({
    enum: enumData.CEFR_LEVEL,
    default: enumData.CEFR_LEVEL.C1,
    description: 'Trình độ đầu ra',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.CEFR_LEVEL.C1.code })
  levelTo?: string;

  @ApiPropertyOptional({ description: 'Thời lượng ước tính (phút)', default: 0 })
  @Column({ type: 'int', default: 0 })
  estimatedMinutes?: number;

  @ApiProperty({
    enum: enumData.COURSE_STATUS,
    default: enumData.COURSE_STATUS.DRAFT.code,
    description: 'Trạng thái khóa học',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.COURSE_STATUS.DRAFT.code })
  status: string;

  @ApiProperty({
    enum: enumData.VISIBILITY,
    default: enumData.VISIBILITY.PUBLIC.code,
    description: 'Chế độ hiển thị',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.VISIBILITY.PUBLIC.code })
  visibility: string;

  @ApiPropertyOptional({ description: 'Người tạo khóa học' })
  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @ApiPropertyOptional({ description: 'Thời điểm xuất bản' })
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;

  @OneToMany(() => CourseVersionEntity, version => version.course)
  versions?: CourseVersionEntity[];

  @OneToMany(() => CourseInstructorEntity, instructor => instructor.course)
  instructors?: CourseInstructorEntity[];

  @OneToMany(() => CourseEnrollmentEntity, enrollment => enrollment.course)
  enrollments?: CourseEnrollmentEntity[];

  @OneToMany(() => CourseReviewEntity, review => review.course)
  reviews?: CourseReviewEntity[];
}
