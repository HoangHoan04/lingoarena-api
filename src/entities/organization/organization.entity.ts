import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { OrganizationMemberEntity } from './organization-member.entity';

/**
 * Bảng `organizations` — tổ chức (trường / trung tâm) dùng cho lớp học B2B.
 * Đỡ endpoint `/user/organization/me/organizations`.
 */
@Entity('organizations')
@Index('uq_organizations_code_alive', ['code'], { unique: true, where: '"isDeleted" = false' })
@Index('uq_organizations_slug_alive', ['slug'], { unique: true, where: '"isDeleted" = false' })
@Index('idx_organizations_status', ['status'])
export class OrganizationEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã tổ chức' })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ description: 'Tên tổ chức' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Slug trên URL' })
  @Column({ type: 'varchar', length: 150 })
  slug: string;

  @ApiPropertyOptional({ description: 'Logo (1 ảnh nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Mã số thuế' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  taxCode?: string;

  @ApiPropertyOptional({ description: 'Email liên hệ' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại liên hệ' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @Column({ type: 'text', nullable: true })
  address?: string;

  @ApiProperty({
    enum: enumData.ORG_STATUS,
    default: enumData.ORG_STATUS.ACTIVE.code,
    description: 'Trạng thái tổ chức',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ORG_STATUS.ACTIVE.code })
  status: string;

  @OneToMany(() => OrganizationMemberEntity, member => member.organization)
  members?: OrganizationMemberEntity[];
}
