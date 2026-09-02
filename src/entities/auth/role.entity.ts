import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { RolePermissionEntity } from './role-permission.entity';
import { UserRoleEntity } from './user-role.entity';

@Entity('roles')
@Index('idx_roles_code', ['code'])
export class RoleEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã vai trò (admin, student, teacher, editor, reviewer, support)' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Tên hiển thị của vai trò' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Cờ xác định vai trò hệ thống', default: false })
  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @OneToMany(() => UserRoleEntity, userRole => userRole.role)
  userRoles?: UserRoleEntity[];

  @OneToMany(() => RolePermissionEntity, rolePermission => rolePermission.role)
  rolePermissions?: RolePermissionEntity[];
}
