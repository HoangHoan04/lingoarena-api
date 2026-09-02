import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionVersionEntity } from './question-version.entity';

@Entity('question_options')
@Index('idx_question_options_ver_key', ['questionVersionId', 'optionKey'], { unique: true })
@Index('idx_question_options_version_id', ['questionVersionId'])
export class QuestionOptionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phiên bản câu hỏi' })
  @Column({ type: 'uuid' })
  questionVersionId: string;

  @ApiProperty({ description: 'Ký tự lựa chọn (A, B, C, D hoặc 1, 2, 3)' })
  @Column({ type: 'varchar', length: 10 })
  optionKey: string;

  @ApiProperty({ description: 'Nội dung phương án' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: 'Cờ đáp án đúng', default: false })
  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @ApiPropertyOptional({ description: 'Giải thích / phản hồi cho lựa chọn này' })
  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => QuestionVersionEntity, qv => qv.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionVersionId' })
  questionVersion?: QuestionVersionEntity;
}
