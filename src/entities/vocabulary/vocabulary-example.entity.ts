import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { MediaAssetEntity } from '../media/media-asset.entity';
import { VocabularyEntity } from './vocabulary.entity';

@Entity('vocabulary_examples')
@Index('idx_vocabulary_examples_vocab_id', ['vocabularyId'])
export class VocabularyExampleEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ vựng' })
  @Column({ type: 'uuid' })
  vocabularyId: string;

  @ApiProperty({ description: 'Câu ví dụ tiếng Anh' })
  @Column({ type: 'text' })
  sentence: string;

  @ApiProperty({ description: 'Bản dịch tiếng Việt' })
  @Column({ type: 'text' })
  translation: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến audio phát âm câu' })
  @Column({ type: 'uuid', nullable: true })
  audioAssetId?: string;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => VocabularyEntity, vocab => vocab.examples, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vocabularyId' })
  vocabulary?: VocabularyEntity;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'audioAssetId' })
  audioAsset?: MediaAssetEntity;
}
