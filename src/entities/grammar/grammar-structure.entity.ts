import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { GrammarTopicEntity } from './grammar-topic.entity';

/**
 * Bảng `grammar_structures` — cấu trúc ngữ pháp cụ thể.
 *
 * `examplesJson` thay bảng `grammar_examples` cũ: ví dụ luôn đọc kèm cấu trúc
 * cha và không bao giờ lọc theo, nên lưu jsonb. Mỗi phần tử gồm
 * `sentence`, `translation`, `explanation`, `isNegativeExample`.
 *
 * Mức thành thạo của người học nằm ở `user_mastery` với `targetType = grammar`.
 */
@Entity('grammar_structures')
@Index('idx_grammar_structures_topic', ['grammarTopicId'])
export class GrammarStructureEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến chủ đề ngữ pháp' })
  @Column({ type: 'uuid' })
  grammarTopicId: string;

  @ApiProperty({ description: 'Tiêu đề cấu trúc' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Tiêu đề tiếng Anh' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  titleEn?: string;

  @ApiProperty({ description: 'Công thức cấu trúc' })
  @Column({ type: 'text' })
  formula: string;

  @ApiProperty({ description: 'Ý nghĩa tiếng Việt' })
  @Column({ type: 'text' })
  meaningVi: string;

  @ApiPropertyOptional({ description: 'Ý nghĩa tiếng Anh' })
  @Column({ type: 'text', nullable: true })
  meaningEn?: string;

  @ApiPropertyOptional({ description: 'Nội dung cách dùng' })
  @Column({ type: 'text', nullable: true })
  usageContent?: string;

  @ApiPropertyOptional({ description: 'Lỗi thường gặp' })
  @Column({ type: 'text', nullable: true })
  commonMistakes?: string;

  @ApiPropertyOptional({
    description: 'Ví dụ minh họa — thay bảng grammar_examples vì chỉ để hiển thị',
  })
  @Column({ type: 'jsonb', nullable: true })
  examplesJson?: Record<string, unknown>[];

  @ApiProperty({ description: 'Thứ tự hiển thị' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => GrammarTopicEntity, topic => topic.structures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grammarTopicId' })
  grammarTopic?: GrammarTopicEntity;
}
