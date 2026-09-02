import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseEntity } from './course.entity';

@Entity('course_reviews')
@Index('idx_course_reviews_course_user', ['courseId', 'userId'], { unique: true })
@Index('idx_course_reviews_course_id', ['courseId'])
@Index('idx_course_reviews_rating', ['rating'])
export class CourseReviewEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến khóa học' })
  @Column({ type: 'uuid' })
  courseId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Số điểm đánh giá (1 to 5)' })
  @Column({ type: 'int' })
  rating: number;

  @ApiPropertyOptional({ description: 'Nội dung nhận xét' })
  @Column({ type: 'text', nullable: true })
  comment?: string;

  @ApiPropertyOptional({ description: 'Phản hồi từ giảng viên' })
  @Column({ type: 'text', nullable: true })
  instructorReply?: string;

  @ApiPropertyOptional({ description: 'Thời điểm giảng viên phản hồi' })
  @Column({ type: 'timestamptz', nullable: true })
  repliedAt?: Date;

  @ApiProperty({ description: 'Cờ hiển thị công khai', default: true })
  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @ManyToOne(() => CourseEntity, course => course.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course?: CourseEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
