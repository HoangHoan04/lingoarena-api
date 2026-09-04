import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseEntity } from './course.entity';
import { LessonEntity } from './lesson.entity';

/** Bảng `course_sections` — chương của khóa học. */
@Entity('course_sections')
@Index('idx_course_sections_course', ['courseId', 'sortOrder'])
export class CourseSectionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến khóa học' })
  @Column({ type: 'uuid' })
  courseId: string;

  @ApiProperty({ description: 'Tiêu đề chương' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Tiêu đề tiếng Anh' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Mô tả chương' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Thứ tự chương trong khóa' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => CourseEntity, course => course.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course?: CourseEntity;

  @OneToMany(() => LessonEntity, lesson => lesson.courseSection)
  lessons?: LessonEntity[];
}
