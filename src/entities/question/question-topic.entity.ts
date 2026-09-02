import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionEntity } from './question.entity';
import { TopicEntity } from './topic.entity';

@Entity('question_topics')
@Index('idx_question_topics_pk', ['questionId', 'topicId'], { unique: true })
export class QuestionTopicEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi' })
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến chủ đề' })
  @Column({ type: 'uuid' })
  topicId: string;

  @ManyToOne(() => QuestionEntity, question => question.questionTopics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question?: QuestionEntity;

  @ManyToOne(() => TopicEntity, topic => topic.questionTopics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topicId' })
  topic?: TopicEntity;
}
