import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { MediaAssetEntity } from '../media/media-asset.entity';
import { VocabularyCollocationEntity } from './vocabulary-collocation.entity';
import { VocabularyExamTypeEntity } from './vocabulary-exam-type.entity';
import { VocabularyExampleEntity } from './vocabulary-example.entity';
import { VocabularyRelationEntity } from './vocabulary-relation.entity';
import { VocabularyTopicEntity } from './vocabulary-topic.entity';

@Entity('vocabularies')
@Index('idx_vocabularies_norm_word', ['normalizedWord'])
@Index('uq_vocabularies_word_pos_alive', ['normalizedWord', 'partOfSpeech'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_vocabularies_cefr_level', ['cefrLevel'])
@Index('idx_vocabularies_status', ['status'])
export class VocabularyEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Từ vựng gốc' })
  @Column({ type: 'varchar', length: 100 })
  headword: string;

  @ApiProperty({ description: 'Từ chuẩn hóa (chữ thường, bỏ dấu cách thừa)' })
  @Column({ type: 'varchar', length: 100 })
  normalizedWord: string;

  @ApiProperty({ description: 'Từ loại (noun, verb, adjective, adverb, idiom, phrasal_verb)' })
  @Column({ type: 'varchar', length: 30 })
  partOfSpeech: string;

  @ApiPropertyOptional({ description: 'Phiên âm IPA UK' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  ipaUk?: string;

  @ApiPropertyOptional({ description: 'Phiên âm IPA US' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  ipaUs?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến audio UK' })
  @Column({ type: 'uuid', nullable: true })
  audioUkAssetId?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến audio US' })
  @Column({ type: 'uuid', nullable: true })
  audioUsAssetId?: string;

  @ApiProperty({ description: 'Định nghĩa tiếng Anh' })
  @Column({ type: 'text' })
  definitionEn: string;

  @ApiProperty({ description: 'Nghĩa tiếng Việt' })
  @Column({ type: 'text' })
  meaningVi: string;

  @ApiPropertyOptional({
    enum: enumData.CEFR_LEVEL,
    default: enumData.CEFR_LEVEL.B1,
    description: 'Trình độ CEFR',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.CEFR_LEVEL.B1.code })
  cefrLevel?: string;

  @ApiPropertyOptional({
    description: 'Cấp độ tần suất xuất hiện (Oxford 3000/5000 index)',
    default: 1,
  })
  @Column({ type: 'int', default: 1 })
  frequencyLevel?: number;

  @ApiProperty({
    enum: enumData.CONTENT_REVIEW_STATUS,
    default: enumData.CONTENT_REVIEW_STATUS.DRAFT.code,
    description: 'Trạng thái kiểm duyệt',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.CONTENT_REVIEW_STATUS.DRAFT.code })
  status: string;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'audioUkAssetId' })
  audioUkAsset?: MediaAssetEntity;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'audioUsAssetId' })
  audioUsAsset?: MediaAssetEntity | null;

  @OneToMany(() => VocabularyExampleEntity, example => example.vocabulary)
  examples?: VocabularyExampleEntity[];

  @OneToMany(() => VocabularyCollocationEntity, collocation => collocation.vocabulary)
  collocations?: VocabularyCollocationEntity[];

  @OneToMany(() => VocabularyRelationEntity, relation => relation.vocabulary)
  relations?: VocabularyRelationEntity[];

  @OneToMany(() => VocabularyTopicEntity, vt => vt.vocabulary)
  vocabularyTopics?: VocabularyTopicEntity[];

  @OneToMany(() => VocabularyExamTypeEntity, vet => vet.vocabulary)
  vocabularyExamTypes?: VocabularyExamTypeEntity[];
}
