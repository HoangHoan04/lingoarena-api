import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { GrammarStructureEntity } from './grammar-structure.entity';

/** Bảng `grammar_topics` — chủ đề ngữ pháp, phân cấp bằng `parentId`. */
@Entity('grammar_topics')
@Index('uq_grammar_topics_slug_alive', ['slug'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_grammar_topics_parent', ['parentId'])
export class GrammarTopicEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Chủ đề cha, null nếu là gốc' })
  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @ApiProperty({ description: 'Slug dùng trên URL' })
  @Column({ type: 'varchar', length: 150 })
  slug: string;

  @ApiProperty({ description: 'Tiêu đề chủ đề' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Tiêu đề tiếng Anh' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({ enum: enumData.CEFR_LEVEL, description: 'Trình độ CEFR' })
  @Column({ type: 'varchar', length: 10, nullable: true })
  cefrLevel?: string;

  @ApiProperty({ description: 'Thứ tự hiển thị' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => GrammarTopicEntity, parent => parent.children, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent?: GrammarTopicEntity;

  @OneToMany(() => GrammarTopicEntity, child => child.parent)
  children?: GrammarTopicEntity[];

  @OneToMany(() => GrammarStructureEntity, structure => structure.grammarTopic)
  structures?: GrammarStructureEntity[];
}
