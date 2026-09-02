import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { RoleEntity } from './role.entity';
import { UserEntity } from './user.entity';

@Entity('user_roles')
@Index('idx_user_roles_unique', ['userId', 'roleId', 'scopeType', 'scopeId'], { unique: true })
@Index('idx_user_roles_user_id', ['userId'])
@Index('idx_user_roles_role_id', ['roleId'])
export class UserRoleEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến vai trò' })
  @Column({ type: 'uuid' })
  roleId: string;

  @ApiProperty({
    enum: enumData.SCOPE_TYPE,
    default: enumData.SCOPE_TYPE.GLOBAL.code,
    description: 'Phạm vi vai trò',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.SCOPE_TYPE.GLOBAL.code })
  scopeType: string;

  @ApiPropertyOptional({ description: 'ID lớp học hoặc tổ chức nếu có phạm vi' })
  @Column({ type: 'uuid', nullable: true })
  scopeId?: string;

  @ManyToOne(() => UserEntity, user => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => RoleEntity, role => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role?: RoleEntity;
}
