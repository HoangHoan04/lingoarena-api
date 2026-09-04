import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { VocabularyEntity } from './vocabulary.entity';

/**
 * Bảng `vocabulary_relations` — quan hệ giữa hai từ (đồng nghĩa, trái nghĩa, họ từ).
 * Giữ dạng bảng thay vì jsonb vì có khóa ngoại và cần join sang từ liên quan.
 */
@Entity('vocabulary_relations')
@Index('uq_vocabulary_relations_link', ['vocabularyId', 'relatedVocabularyId', 'relationType'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class VocabularyRelationEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ gốc' })
  @Column({ type: 'uuid' })
  vocabularyId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ liên quan' })
  @Column({ type: 'uuid' })
  relatedVocabularyId: string;

  @ApiProperty({ enum: enumData.VOCAB_RELATION_TYPE, description: 'Loại quan hệ' })
  @Column({ type: 'varchar', length: 20 })
  relationType: string;

  @ManyToOne(() => VocabularyEntity, vocabulary => vocabulary.relations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vocabularyId' })
  vocabulary?: VocabularyEntity;

  @ManyToOne(() => VocabularyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'relatedVocabularyId' })
  relatedVocabulary?: VocabularyEntity;
}
