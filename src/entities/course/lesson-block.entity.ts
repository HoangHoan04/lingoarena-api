import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionGroupEntity } from '../question/question-group.entity';
import { LessonEntity } from './lesson.entity';

/**
 * Bảng `lesson_blocks` — khối nội dung có thứ tự trong bài học.
 *
 * Bỏ bảng `lesson_block_items` cũ: danh sách câu hỏi của block quiz nằm trong
 * `contentJson` hoặc trỏ qua `questionGroupId`.
 * Tài liệu kèm (nhiều file) nối qua `media_attachments`.
 */
@Entity('lesson_blocks')
@Index('idx_lesson_blocks_lesson', ['lessonId', 'sortOrder'])
export class LessonBlockEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến bài học' })
  @Column({ type: 'uuid' })
  lessonId: string;

  @ApiProperty({ enum: enumData.LESSON_BLOCK_TYPE, description: 'Loại khối nội dung' })
  @Column({ type: 'varchar', length: 30 })
  blockType: string;

  @ApiProperty({ description: 'Nội dung khối (bắt buộc)' })
  @Column({ type: 'jsonb' })
  contentJson: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Nhóm câu hỏi khi khối là bài tập tương tác' })
  @Column({ type: 'uuid', nullable: true })
  questionGroupId?: string;

  @ApiProperty({ description: 'Thứ tự khối trong bài' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => LessonEntity, lesson => lesson.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson?: LessonEntity;

  @ManyToOne(() => QuestionGroupEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'questionGroupId' })
  questionGroup?: QuestionGroupEntity;
}
