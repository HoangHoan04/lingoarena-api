import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { VocabularyDeckItemEntity } from './vocabulary-deck-item.entity';

/**
 * Bảng `vocabulary_decks` — bộ từ vựng. `ownerType = user` cho phép người học
 * tự tạo bộ riêng.
 *
 * Tiến độ học của người dùng KHÔNG nằm ở đây mà ở `user_vocabulary_states`.
 */
@Entity('vocabulary_decks')
@Index('uq_vocabulary_decks_slug_alive', ['slug'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_vocabulary_decks_owner', ['ownerType', 'ownerId'])
@Index('idx_vocabulary_decks_visibility', ['visibility'])
export class VocabularyDeckEntity extends PrimaryBaseEntity {
  @ApiProperty({ enum: enumData.VOCAB_DECK_OWNER_TYPE, description: 'Loại chủ sở hữu' })
  @Column({ type: 'varchar', length: 20, default: enumData.VOCAB_DECK_OWNER_TYPE.SYSTEM.code })
  ownerType: string;

  @ApiPropertyOptional({ description: 'ID chủ sở hữu (null nếu là bộ hệ thống)' })
  @Column({ type: 'uuid', nullable: true })
  ownerId?: string;

  @ApiProperty({ description: 'Slug dùng trên URL' })
  @Column({ type: 'varchar', length: 150 })
  slug: string;

  @ApiProperty({ description: 'Tên bộ từ' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Tên tiếng Anh' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({ description: 'Ảnh bìa (1 ảnh nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: enumData.CEFR_LEVEL, description: 'Trình độ CEFR' })
  @Column({ type: 'varchar', length: 10, nullable: true })
  cefrLevel?: string;

  @ApiProperty({
    enum: enumData.VISIBILITY,
    default: enumData.VISIBILITY.PUBLIC.code,
    description: 'Phạm vi hiển thị',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.VISIBILITY.PUBLIC.code })
  visibility: string;

  @ApiProperty({ description: 'Số từ trong bộ — denormalize để list không phải count' })
  @Column({ type: 'int', default: 0 })
  itemCount: number;

  @OneToMany(() => VocabularyDeckItemEntity, item => item.deck)
  items?: VocabularyDeckItemEntity[];
}
