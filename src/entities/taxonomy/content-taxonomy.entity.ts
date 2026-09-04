import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { TaxonomyEntity } from './taxonomy.entity';

/**
 * Bảng `content_taxonomies` — nối phân loại vào bất kỳ entity nội dung nào (đa hình).
 * Thay 4 bảng nối cũ: `question_topics`, `question_tags`, `vocabulary_topics`,
 * `vocabulary_exam_types`.
 */
@Entity('content_taxonomies')
@Index('uq_content_taxonomies_link', ['taxonomyId', 'entityType', 'entityId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_content_taxonomies_entity', ['entityType', 'entityId'])
export class ContentTaxonomyEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phân loại' })
  @Column({ type: 'uuid' })
  taxonomyId: string;

  @ApiProperty({ description: 'Tên class entity được gắn nhãn (vd QuestionEntity)' })
  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @ApiProperty({ description: 'ID bản ghi được gắn nhãn' })
  @Column({ type: 'uuid' })
  entityId: string;

  @ManyToOne(() => TaxonomyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taxonomyId' })
  taxonomy?: TaxonomyEntity;
}
