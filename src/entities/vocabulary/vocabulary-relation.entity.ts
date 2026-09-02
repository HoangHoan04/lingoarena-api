import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { VocabularyEntity } from './vocabulary.entity';

@Entity('vocabulary_relations')
@Index('idx_vocabulary_relations_unique', ['vocabularyId', 'relatedVocabularyId', 'relationType'], {
  unique: true,
})
@Index('idx_vocabulary_relations_vocab_id', ['vocabularyId'])
export class VocabularyRelationEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ vựng gốc' })
  @Column({ type: 'uuid' })
  vocabularyId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ vựng liên quan' })
  @Column({ type: 'uuid' })
  relatedVocabularyId: string;

  @ApiProperty({ description: 'Loại quan hệ (synonym, antonym, word_family, confusable)' })
  @Column({ type: 'varchar', length: 30 })
  relationType: string;

  @ManyToOne(() => VocabularyEntity, vocab => vocab.relations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vocabularyId' })
  vocabulary?: VocabularyEntity;

  @ManyToOne(() => VocabularyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'relatedVocabularyId' })
  relatedVocabulary?: VocabularyEntity;
}
