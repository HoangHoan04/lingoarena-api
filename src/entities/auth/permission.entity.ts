import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { RolePermissionEntity } from './role-permission.entity';

@Entity('permissions')
@Index('idx_permissions_code', ['code'])
@Index('idx_permissions_resource_action', ['resource', 'action'])
export class PermissionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã quyền (course:create, exam:grade, user:manage)' })
  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @ApiProperty({ description: 'Tài nguyên' })
  @Column({ type: 'varchar', length: 50 })
  resource: string;

  @ApiProperty({ description: 'Hành động' })
  @Column({ type: 'varchar', length: 50 })
  action: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => RolePermissionEntity, rolePermission => rolePermission.permission)
  rolePermissions?: RolePermissionEntity[];
}
