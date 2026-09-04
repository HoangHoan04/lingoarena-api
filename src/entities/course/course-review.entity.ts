import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseEntity } from './course.entity';

/** Bảng `course_reviews` — đánh giá khóa học, mỗi người 1 lần. */
@Entity('course_reviews')
@Index('uq_course_reviews_course_user', ['courseId', 'userId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_course_reviews_course', ['courseId'])
export class CourseReviewEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến khóa học' })
  @Column({ type: 'uuid' })
  courseId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người đánh giá' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Số sao từ 1 đến 5' })
  @Column({ type: 'int' })
  rating: number;

  @ApiPropertyOptional({ description: 'Nội dung nhận xét' })
  @Column({ type: 'text', nullable: true })
  comment?: string;

  @ApiPropertyOptional({ description: 'Điểm mục tiêu người học đạt được sau khóa' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  targetBand?: string;

  @ApiProperty({ description: 'Số người thấy đánh giá này hữu ích' })
  @Column({ type: 'int', default: 0 })
  helpfulCount: number;

  @ManyToOne(() => CourseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course?: CourseEntity;
}
