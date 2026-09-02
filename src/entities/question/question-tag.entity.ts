import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionEntity } from './question.entity';
import { TagEntity } from './tag.entity';

@Entity('question_tags')
@Index('idx_question_tags_pk', ['questionId', 'tagId'], { unique: true })
export class QuestionTagEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi' })
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến thẻ' })
  @Column({ type: 'uuid' })
  tagId: string;

  @ManyToOne(() => QuestionEntity, question => question.questionTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question?: QuestionEntity;

  @ManyToOne(() => TagEntity, tag => tag.questionTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag?: TagEntity;
}
