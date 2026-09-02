import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseSectionEntity } from './course-section.entity';
import { LessonBlockEntity } from './lesson-block.entity';

@Entity('lessons')
@Index('idx_lessons_course_section_id', ['courseSectionId'])
export class LessonEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến chương học phần' })
  @Column({ type: 'uuid' })
  courseSectionId: string;

  @ApiProperty({ description: 'Tiêu đề bài học' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    enum: enumData.LESSON_TYPE,
    default: enumData.LESSON_TYPE.LECTURE.code,
    description: 'Loại bài học',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.LESSON_TYPE.LECTURE.code })
  lessonType: string;

  @ApiPropertyOptional({ description: 'Thời lượng ước tính (phút)', default: 15 })
  @Column({ type: 'int', default: 15 })
  estimatedMinutes?: number;

  @ApiProperty({ description: 'Cờ cho phép học thử miễn phí', default: false })
  @Column({ type: 'boolean', default: false })
  isPreview: boolean;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({
    enum: enumData.LESSON_STATUS,
    default: enumData.LESSON_STATUS.DRAFT.code,
    description: 'Trạng thái bài học',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.LESSON_STATUS.DRAFT.code })
  status: string;

  @ManyToOne(() => CourseSectionEntity, section => section.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseSectionId' })
  courseSection?: CourseSectionEntity;

  @OneToMany(() => LessonBlockEntity, block => block.lesson)
  blocks?: LessonBlockEntity[];
}
