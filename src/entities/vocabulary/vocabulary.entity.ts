import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { VocabularyRelationEntity } from './vocabulary-relation.entity';

/**
 * Bảng `vocabularies` — từ vựng trong từ điển.
 *
 * `examplesJson` và `collocationsJson` thay 2 bảng con cũ: dữ liệu này chỉ để
 * hiển thị trong chi tiết từ, không bao giờ lọc / join theo, nên lưu jsonb.
 * Ngược lại `vocabulary_relations` vẫn là bảng vì có khóa ngoại sang từ khác.
 *
 * Audio UK / US là 2 slot cố định khác nghĩa nên lưu URL thẳng, không tách bảng.
 */
@Entity('vocabularies')
@Index('uq_vocabularies_word_pos_alive', ['normalizedWord', 'partOfSpeech'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_vocabularies_norm_word', ['normalizedWord'])
@Index('idx_vocabularies_cefr_level', ['cefrLevel'])
export class VocabularyEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Từ vựng gốc' })
  @Column({ type: 'varchar', length: 100 })
  headword: string;

  @ApiProperty({ description: 'Từ chuẩn hóa (chữ thường, bỏ dấu cách thừa)' })
  @Column({ type: 'varchar', length: 100 })
  normalizedWord: string;

  @ApiProperty({ enum: enumData.PART_OF_SPEECH, description: 'Từ loại' })
  @Column({ type: 'varchar', length: 30 })
  partOfSpeech: string;

  @ApiPropertyOptional({ description: 'Phiên âm IPA UK' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  ipaUk?: string;

  @ApiPropertyOptional({ description: 'Phiên âm IPA US' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  ipaUs?: string;

  @ApiPropertyOptional({ description: 'Audio phát âm UK (1 file nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  audioUkUrl?: string;

  @ApiPropertyOptional({ description: 'Audio phát âm US (1 file nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  audioUsUrl?: string;

  @ApiPropertyOptional({ description: 'Ảnh minh họa từ (1 ảnh nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Định nghĩa tiếng Anh' })
  @Column({ type: 'text', nullable: true })
  definitionEn?: string;

  @ApiPropertyOptional({ description: 'Định nghĩa tiếng Việt' })
  @Column({ type: 'text', nullable: true })
  definitionVi?: string;

  @ApiProperty({ description: 'Nghĩa tiếng Việt ngắn gọn' })
  @Column({ type: 'text' })
  meaningVi: string;

  @ApiPropertyOptional({
    enum: enumData.CEFR_LEVEL,
    default: enumData.CEFR_LEVEL.B1.code,
    description: 'Trình độ CEFR',
  })
  @Column({ type: 'varchar', length: 10, default: enumData.CEFR_LEVEL.B1.code })
  cefrLevel?: string;

  @ApiProperty({ description: 'Cấp độ tần suất xuất hiện (Oxford 3000/5000)' })
  @Column({ type: 'int', default: 1 })
  frequencyLevel: number;

  @ApiPropertyOptional({
    description: 'Ví dụ minh họa — thay bảng vocabulary_examples vì chỉ để hiển thị',
  })
  @Column({ type: 'jsonb', nullable: true })
  examplesJson?: Record<string, unknown>[];

  @ApiPropertyOptional({
    description: 'Cụm từ đi kèm — thay bảng vocabulary_collocations vì chỉ để hiển thị',
  })
  @Column({ type: 'jsonb', nullable: true })
  collocationsJson?: Record<string, unknown>[];

  @OneToMany(() => VocabularyRelationEntity, relation => relation.vocabulary)
  relations?: VocabularyRelationEntity[];
}
