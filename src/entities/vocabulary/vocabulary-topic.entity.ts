import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { TopicEntity } from '../question/topic.entity';
import { VocabularyEntity } from './vocabulary.entity';

@Entity('vocabulary_topics')
@Index('idx_vocabulary_topics_pk', ['vocabularyId', 'topicId'], { unique: true })
export class VocabularyTopicEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ vựng' })
  @Column({ type: 'uuid' })
  vocabularyId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến chủ đề' })
  @Column({ type: 'uuid' })
  topicId: string;

  @ManyToOne(() => VocabularyEntity, vocab => vocab.vocabularyTopics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vocabularyId' })
  vocabulary?: VocabularyEntity;

  @ManyToOne(() => TopicEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topicId' })
  topic?: TopicEntity;
}
