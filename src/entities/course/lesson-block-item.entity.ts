import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionEntity } from '../question/question.entity';
import { QuestionVersionEntity } from '../question/question-version.entity';
import { LessonBlockEntity } from './lesson-block.entity';

@Entity('lesson_block_items')
@Index('uq_lesson_block_items_block_question', ['lessonBlockId', 'questionId'], { unique: true })
@Index('idx_lesson_block_items_block_id', ['lessonBlockId'])
export class LessonBlockItemEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến khối bài học' })
  @Column({ type: 'uuid' })
  lessonBlockId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi' })
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phiên bản câu hỏi đã chốt' })
  @Column({ type: 'uuid' })
  questionVersionId: string;

  @ApiProperty({ description: 'Điểm của câu trong block', default: 1 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  points: number;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Bắt buộc trả lời', default: true })
  @Column({ type: 'boolean', default: true })
  isRequired?: boolean;

  @ManyToOne(() => LessonBlockEntity, block => block.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonBlockId' })
  lessonBlock?: LessonBlockEntity;

  @ManyToOne(() => QuestionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionId' })
  question?: QuestionEntity;

  @ManyToOne(() => QuestionVersionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionVersionId' })
  questionVersion?: QuestionVersionEntity;
}
