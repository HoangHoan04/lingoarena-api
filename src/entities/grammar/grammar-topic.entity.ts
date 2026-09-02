import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { TopicEntity } from '../question/topic.entity';
import { GrammarStructureEntity } from './grammar-structure.entity';

@Entity('grammar_topics')
@Index('idx_grammar_topics_slug', ['slug'], { unique: true })
@Index('idx_grammar_topics_parent_id', ['parentId'])
@Index('idx_grammar_topics_canonical_topic', ['canonicalTopicId'])
export class GrammarTopicEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến chủ đề ngữ pháp cha' })
  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @ApiProperty({ description: 'Tiêu đề chủ đề ngữ pháp' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Chuỗi slug thân thiện với URL' })
  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @ApiPropertyOptional({
    enum: enumData.CEFR_LEVEL,
    default: enumData.CEFR_LEVEL.A2,
    description: 'Trình độ CEFR',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.CEFR_LEVEL.A2.code })
  cefrLevel?: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Chủ đề chuẩn trong ngân hàng topics (lọc chéo grammar/vocab)' })
  @Column({ type: 'uuid', nullable: true })
  canonicalTopicId?: string;

  @ManyToOne(() => GrammarTopicEntity, topic => topic.children, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent?: GrammarTopicEntity;

  @OneToMany(() => GrammarTopicEntity, topic => topic.parent)
  children?: GrammarTopicEntity[];

  @OneToMany(() => GrammarStructureEntity, structure => structure.grammarTopic)
  structures?: GrammarStructureEntity[];

  @ManyToOne(() => TopicEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'canonicalTopicId' })
  canonicalTopic?: TopicEntity;
}
