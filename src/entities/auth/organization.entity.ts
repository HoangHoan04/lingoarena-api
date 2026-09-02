import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { OrganizationMemberEntity } from './organization-member.entity';

@Entity('organizations')
@Index('idx_organizations_code', ['code'])
@Index('idx_organizations_status', ['status'])
export class OrganizationEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã định danh doanh nghiệp' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Tên tổ chức / doanh nghiệp' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiPropertyOptional({ description: 'Email liên hệ' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại liên hệ' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ thanh toán' })
  @Column({ type: 'text', nullable: true })
  billingAddress?: string;

  @ApiPropertyOptional({ description: 'URL logo' })
  @Column({ type: 'text', nullable: true })
  logoUrl?: string;

  @ApiProperty({ description: 'Giới hạn số lượng tài khoản (0 = không giới hạn)', default: 0 })
  @Column({ type: 'int', default: 0 })
  seatLimit: number;

  @ApiProperty({
    enum: enumData.ORG_STATUS,
    default: enumData.ORG_STATUS.ACTIVE.code,
    description: 'Trạng thái tổ chức',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ORG_STATUS.ACTIVE.code })
  status: string;

  @ApiProperty({ description: 'Số ghế đang sử dụng', default: 0 })
  @Column({ type: 'int', default: 0 })
  seatUsed: number;

  @OneToMany(() => OrganizationMemberEntity, member => member.organization)
  members?: OrganizationMemberEntity[];
}
