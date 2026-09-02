import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { VocabularyEntity } from './vocabulary.entity';

@Entity('vocabulary_collocations')
@Index('idx_vocabulary_collocations_vocab_id', ['vocabularyId'])
export class VocabularyCollocationEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ vựng' })
  @Column({ type: 'uuid' })
  vocabularyId: string;

  @ApiProperty({ description: 'Cụm từ kết hợp (collocation)' })
  @Column({ type: 'varchar', length: 255 })
  collocation: string;

  @ApiPropertyOptional({ description: 'Nghĩa tiếng Việt' })
  @Column({ type: 'text', nullable: true })
  meaningVi?: string;

  @ApiPropertyOptional({ description: 'Câu ví dụ sử dụng cụm từ' })
  @Column({ type: 'text', nullable: true })
  exampleSentence?: string;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => VocabularyEntity, vocab => vocab.collocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vocabularyId' })
  vocabulary?: VocabularyEntity;
}
