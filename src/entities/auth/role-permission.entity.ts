import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { PermissionEntity } from './permission.entity';
import { RoleEntity } from './role.entity';

@Entity('role_permissions')
@Index('idx_role_permissions_role_perm', ['roleId', 'permissionId'], { unique: true })
export class RolePermissionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến vai trò' })
  @Column({ type: 'uuid' })
  roleId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến quyền' })
  @Column({ type: 'uuid' })
  permissionId: string;

  @ManyToOne(() => RoleEntity, role => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role?: RoleEntity;

  @ManyToOne(() => PermissionEntity, permission => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permissionId' })
  permission?: PermissionEntity;
}
