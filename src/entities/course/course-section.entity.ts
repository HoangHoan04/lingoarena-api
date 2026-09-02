import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseVersionEntity } from './course-version.entity';
import { LessonEntity } from './lesson.entity';

@Entity('course_sections')
@Index('idx_course_sections_version_id', ['courseVersionId'])
export class CourseSectionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phiên bản khóa học' })
  @Column({ type: 'uuid' })
  courseVersionId: string;

  @ApiProperty({ description: 'Tiêu đề chương / học phần' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => CourseVersionEntity, version => version.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseVersionId' })
  courseVersion?: CourseVersionEntity;

  @OneToMany(() => LessonEntity, lesson => lesson.courseSection)
  lessons?: LessonEntity[];
}
