import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { DATA_SOURCE } from '~/common/constants/typeorm';
import { canAccessApiPath, mergeRolePermissions } from '~/common/helpers/permission.helper';
import { RoleEntity, UserRoleEntity } from '~/entities';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;
    if (user.isAdmin) return true;

    const requestPath = request.originalUrl || request.url;
    const profile = await this.loadUserPermissionProfile(user.id);

    if (canAccessApiPath(requestPath, profile, false)) {
      return true;
    }

    throw new ForbiddenException('Bạn không có quyền truy cập chức năng này');
  }

  private async loadUserPermissionProfile(userId: string) {
    const userRoleRepo = this.dataSource.getRepository(UserRoleEntity);
    const roleRepo = this.dataSource.getRepository(RoleEntity);

    const userRoles = await userRoleRepo.find({
      where: { userId, isDeleted: false },
      select: { roleId: true },
    });

    if (!userRoles.length) {
      return mergeRolePermissions([]);
    }

    const roles = await roleRepo.find({
      where: { id: In(userRoles.map(item => item.roleId)), isDeleted: false },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    return mergeRolePermissions(roles);
  }
}
