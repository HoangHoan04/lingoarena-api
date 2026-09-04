import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { configEnv } from '~/config/env';
import { UserRepo } from '~/repositories';
import { resolveDisplayName } from './helpers';

const { JWT_SECRET } = configEnv();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepo: UserRepo) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: { userId: string; isRefreshToken?: boolean }) {
    if (payload.isRefreshToken) {
      throw new UnauthorizedException('Không thể dùng refresh token để xác thực trực tiếp');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.userId, isDeleted: false },
      relations: {
        profile: true,
        userRoles: {
          role: true,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Không có quyền truy cập');
    }

    if (user.isDeleted === true) {
      throw new UnauthorizedException('Tài khoản đã bị tạm khóa, vui lòng liên hệ bộ phận hỗ trợ');
    }

    const roles = user.userRoles?.map(ur => ur.role?.code).filter(Boolean) || [];
    const permissions = Array.from(
      new Set(
        user.userRoles?.flatMap(ur => ur.role?.permissionCodes || []) || [],
      ),
    );

    const isAdmin = Boolean(
      (user as any).isAdmin ||
      roles.some(
        r => {
          const upper = String(r).toUpperCase();
          return upper === 'ADMIN' || upper === 'SUPER_ADMIN' || upper === 'SUPERADMIN';
        },
      ),
    );
    const name = resolveDisplayName(user.profile, user) || user.email;

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      username: user.username || user.email,
      name,
      fullName: user.profile?.fullName || name,
      avatarUrl: user.profile?.avatarUrl,
      profile: user.profile,
      roles,
      permissions,
      isAdmin,
    };
  }
}
