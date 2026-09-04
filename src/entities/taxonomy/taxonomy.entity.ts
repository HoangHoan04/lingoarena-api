import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';

/**
 * Bảng `taxonomies` — gộp `topics` + `tags` cũ thành một cây phân loại dùng chung.
 * Phân biệt bằng `kind`; `parentId` cho phép phân cấp nhiều tầng.
 */
@Entity('taxonomies')
@Index('uq_taxonomies_kind_slug_alive', ['kind', 'slug'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_taxonomies_kind', ['kind'])
@Index('idx_taxonomies_parent', ['parentId'])
export class TaxonomyEntity extends PrimaryBaseEntity {
  @ApiProperty({ enum: enumData.TAXONOMY_KIND, description: 'Loại phân loại' })
  @Column({ type: 'varchar', length: 20 })
  kind: string;

  @ApiPropertyOptional({ description: 'Node cha, null nếu là gốc' })
  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @ApiPropertyOptional({ description: 'Mã tra cứu nội bộ' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  code?: string;

  @ApiProperty({ description: 'Slug dùng trên URL' })
  @Column({ type: 'varchar', length: 150 })
  slug: string;

  @ApiProperty({ description: 'Tên hiển thị' })
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @ApiPropertyOptional({ description: 'Tên tiếng Anh' })
  @Column({ type: 'varchar', length: 200, nullable: true })
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Thứ tự hiển thị' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => TaxonomyEntity, parent => parent.children, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent?: TaxonomyEntity;

  @OneToMany(() => TaxonomyEntity, child => child.parent)
  children?: TaxonomyEntity[];
}
