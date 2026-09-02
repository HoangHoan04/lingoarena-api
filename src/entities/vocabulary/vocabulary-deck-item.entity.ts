import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { VocabularyDeckEntity } from './vocabulary-deck.entity';
import { VocabularyEntity } from './vocabulary.entity';

@Entity('vocabulary_deck_items')
@Index('idx_vocabulary_deck_items_pk', ['deckId', 'vocabularyId'], { unique: true })
@Index('idx_vocabulary_deck_items_deck_id', ['deckId'])
export class VocabularyDeckItemEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến bộ thẻ từ vựng' })
  @Column({ type: 'uuid' })
  deckId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ vựng' })
  @Column({ type: 'uuid' })
  vocabularyId: string;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Ghi chú thêm cho từ trong deck' })
  @Column({ type: 'text', nullable: true })
  note?: string;

  @ManyToOne(() => VocabularyDeckEntity, deck => deck.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deckId' })
  deck?: VocabularyDeckEntity;

  @ManyToOne(() => VocabularyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vocabularyId' })
  vocabulary?: VocabularyEntity;
}
