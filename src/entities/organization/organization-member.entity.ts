import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { OrganizationEntity } from './organization.entity';

/** Bảng `organization_members` — thành viên của tổ chức. */
@Entity('organization_members')
@Index('uq_organization_members_link', ['organizationId', 'userId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_organization_members_user', ['userId'])
export class OrganizationMemberEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến tổ chức' })
  @Column({ type: 'uuid' })
  organizationId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    enum: enumData.ORG_MEMBER_ROLE,
    default: enumData.ORG_MEMBER_ROLE.MEMBER.code,
    description: 'Vai trò trong tổ chức',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ORG_MEMBER_ROLE.MEMBER.code })
  role: string;

  @ApiProperty({ description: 'Thời điểm tham gia' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @ManyToOne(() => OrganizationEntity, organization => organization.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization?: OrganizationEntity;
}
