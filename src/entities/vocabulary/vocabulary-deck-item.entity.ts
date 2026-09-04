import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { VocabularyDeckEntity } from './vocabulary-deck.entity';
import { VocabularyEntity } from './vocabulary.entity';

/** Bảng `vocabulary_deck_items` — từ thuộc bộ từ vựng. */
@Entity('vocabulary_deck_items')
@Index('uq_vocabulary_deck_items_link', ['deckId', 'vocabularyId'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class VocabularyDeckItemEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến bộ từ' })
  @Column({ type: 'uuid' })
  deckId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ vựng' })
  @Column({ type: 'uuid' })
  vocabularyId: string;

  @ApiProperty({ description: 'Thứ tự trong bộ' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => VocabularyDeckEntity, deck => deck.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deckId' })
  deck?: VocabularyDeckEntity;

  @ManyToOne(() => VocabularyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vocabularyId' })
  vocabulary?: VocabularyEntity;
}
