import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseSectionEntity } from './course-section.entity';
import { CourseEntity } from './course.entity';

@Entity('course_versions')
@Index('idx_course_versions_course_ver', ['courseId', 'versionNumber'], { unique: true })
@Index('idx_course_versions_course_id', ['courseId'])
export class CourseVersionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến khóa học' })
  @Column({ type: 'uuid' })
  courseId: string;

  @ApiProperty({ description: 'Số thứ tự phiên bản', default: 1 })
  @Column({ type: 'int', default: 1 })
  versionNumber: number;

  @ApiPropertyOptional({ description: 'Ghi chú thay đổi phiên bản' })
  @Column({ type: 'text', nullable: true })
  changeNote?: string;

  @ApiProperty({
    enum: enumData.COURSE_STATUS,
    default: enumData.COURSE_STATUS.DRAFT.code,
    description: 'Trạng thái phiên bản',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.COURSE_STATUS.DRAFT.code })
  status: string;

  @ApiPropertyOptional({ description: 'Thời điểm xuất bản' })
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @ApiPropertyOptional({ description: 'ID người tạo phiên bản' })
  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @ManyToOne(() => CourseEntity, course => course.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course?: CourseEntity;

  @OneToMany(() => CourseSectionEntity, section => section.courseVersion)
  sections?: CourseSectionEntity[];
}
