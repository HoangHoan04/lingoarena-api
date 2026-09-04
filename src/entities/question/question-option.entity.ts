import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionEntity } from './question.entity';

/** Bảng `question_options` — đáp án lựa chọn của câu hỏi. */
@Entity('question_options')
@Index('uq_question_options_question_key', ['questionId', 'optionKey'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class QuestionOptionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi' })
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Khóa lựa chọn (A, B, C, D)' })
  @Column({ type: 'varchar', length: 10 })
  optionKey: string;

  @ApiProperty({ description: 'Nội dung lựa chọn' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: 'Đây có phải đáp án đúng' })
  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @ApiPropertyOptional({ description: 'Phản hồi khi người học chọn lựa chọn này' })
  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @ApiProperty({ description: 'Thứ tự hiển thị' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => QuestionEntity, question => question.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question?: QuestionEntity;
}
