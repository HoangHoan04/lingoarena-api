import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseSectionEntity } from './course-section.entity';
import { LessonBlockEntity } from './lesson-block.entity';

/** Bảng `lessons` — bài học trong một chương. */
@Entity('lessons')
@Index('idx_lessons_section', ['courseSectionId', 'sortOrder'])
export class LessonEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến chương' })
  @Column({ type: 'uuid' })
  courseSectionId: string;

  @ApiPropertyOptional({ description: 'Slug dùng trên URL' })
  @Column({ type: 'varchar', length: 150, nullable: true })
  slug?: string;

  @ApiProperty({ description: 'Tiêu đề bài học' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ enum: enumData.LESSON_TYPE, description: 'Loại bài học' })
  @Column({ type: 'varchar', length: 20 })
  lessonType: string;

  @ApiPropertyOptional({ description: 'Thời lượng dự kiến (phút)' })
  @Column({ type: 'int', nullable: true })
  estimatedMinutes?: number;

  @ApiProperty({ description: 'Cho học thử không cần mua khóa' })
  @Column({ type: 'boolean', default: false })
  isPreview: boolean;

  @ApiProperty({ description: 'Thứ tự bài trong chương' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => CourseSectionEntity, section => section.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseSectionId' })
  courseSection?: CourseSectionEntity;

  @OneToMany(() => LessonBlockEntity, block => block.lesson)
  blocks?: LessonBlockEntity[];
}
