import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamTypeEntity } from '../exam/exam-type.entity';
import { CourseSectionEntity } from './course-section.entity';

/**
 * Bảng `courses` — khóa học.
 *
 * **Không có cột giá.** Khóa học được bán qua `products` +
 * `product_entitlements`, nên một khóa có thể nằm trong nhiều gói / combo mà
 * không phải nhân bản dữ liệu giá.
 *
 * `instructorsJson` thay bảng `course_instructors` cũ: thông tin giảng viên chỉ
 * để hiển thị ở trang chi tiết, không lọc / join theo.
 */
@Entity('courses')
@Index('uq_courses_code_alive', ['code'], { unique: true, where: '"isDeleted" = false' })
@Index('uq_courses_slug_alive', ['slug'], { unique: true, where: '"isDeleted" = false' })
@Index('idx_courses_exam_type', ['examTypeId'])
@Index('idx_courses_status', ['status'])
export class CourseEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid', nullable: true })
  examTypeId?: string;

  @ApiProperty({ description: 'Mã khóa học' })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ description: 'Slug dùng trên URL' })
  @Column({ type: 'varchar', length: 150 })
  slug: string;

  @ApiProperty({ description: 'Tiêu đề khóa học' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Tiêu đề tiếng Anh' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Mô tả ngắn hiển thị ở thẻ khóa học' })
  @Column({ type: 'text', nullable: true })
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Mô tả đầy đủ' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({ description: 'Ảnh bìa (1 ảnh nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: enumData.CEFR_LEVEL, description: 'Trình độ đầu vào' })
  @Column({ type: 'varchar', length: 10, nullable: true })
  levelFrom?: string;

  @ApiPropertyOptional({ enum: enumData.CEFR_LEVEL, description: 'Trình độ đầu ra' })
  @Column({ type: 'varchar', length: 10, nullable: true })
  levelTo?: string;

  @ApiPropertyOptional({ description: 'Thời lượng dự kiến (phút)' })
  @Column({ type: 'int', nullable: true })
  estimatedMinutes?: number;

  @ApiPropertyOptional({
    description: 'Giảng viên — thay bảng course_instructors vì chỉ để hiển thị',
  })
  @Column({ type: 'jsonb', nullable: true })
  instructorsJson?: Record<string, unknown>[];

  @ApiProperty({
    enum: enumData.COURSE_STATUS,
    default: enumData.COURSE_STATUS.NEW.code,
    description: 'Trạng thái phát hành',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.COURSE_STATUS.NEW.code })
  status: string;

  @ApiProperty({
    enum: enumData.VISIBILITY,
    default: enumData.VISIBILITY.PUBLIC.code,
    description: 'Phạm vi hiển thị',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.VISIBILITY.PUBLIC.code })
  visibility: string;

  @ApiPropertyOptional({ description: 'Thời điểm phát hành' })
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @ApiProperty({ description: 'Số học viên đã đăng ký — denormalize' })
  @Column({ type: 'int', default: 0 })
  enrollmentCount: number;

  @ApiPropertyOptional({ description: 'Điểm đánh giá trung bình — denormalize từ course_reviews' })
  @Column({ type: 'numeric', precision: 3, scale: 2, nullable: true })
  ratingAvg?: number;

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;

  @OneToMany(() => CourseSectionEntity, section => section.course)
  sections?: CourseSectionEntity[];
}
