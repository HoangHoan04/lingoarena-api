import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamTypeEntity } from '../exam/exam-type.entity';
import { VocabularyDeckItemEntity } from './vocabulary-deck-item.entity';

@Entity('vocabulary_decks')
@Index('idx_vocabulary_decks_slug', ['slug'], { unique: true })
@Index('idx_vocabulary_decks_owner_id', ['ownerId'])
@Index('idx_vocabulary_decks_exam_type_id', ['examTypeId'])
export class VocabularyDeckEntity extends PrimaryBaseEntity {
  @ApiProperty({
    enum: enumData.VOCAB_DECK_OWNER_TYPE,
    default: enumData.VOCAB_DECK_OWNER_TYPE.SYSTEM.code,
    description: 'Loại chủ sở hữu',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.VOCAB_DECK_OWNER_TYPE.SYSTEM.code })
  ownerType: string;

  @ApiPropertyOptional({ description: 'ID người sở hữu deck' })
  @Column({ type: 'uuid', nullable: true })
  ownerId?: string;

  @ApiProperty({ description: 'Tiêu đề bộ thẻ từ vựng' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Chuỗi slug thân thiện với URL' })
  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn thumbnail' })
  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;

  @ApiProperty({
    enum: enumData.VISIBILITY,
    default: enumData.VISIBILITY.PUBLIC.code,
    description: 'Chế độ hiển thị',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.VISIBILITY.PUBLIC.code })
  visibility: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid', nullable: true })
  examTypeId?: string;

  @ApiPropertyOptional({ enum: enumData.CEFR_LEVEL, description: 'Trình độ CEFR' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  level?: string;

  @ApiProperty({ description: 'Số lượng từ trong bộ thẻ', default: 0 })
  @Column({ type: 'int', default: 0 })
  itemCount: number;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner?: UserEntity;

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;

  @OneToMany(() => VocabularyDeckItemEntity, item => item.deck)
  items?: VocabularyDeckItemEntity[];
}
