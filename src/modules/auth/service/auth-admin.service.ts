import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { ILike } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { configEnv } from '~/config/env';
import { PaginationDto, UserDto } from '~/dto';
import { ActionLogService } from '~/modules/action-log/action-log.service';
import { I18nCustomService } from '~/modules/i18n-custom-module/i18n.service';
import { RoleRepo, UserProfileRepo, UserRepo, UserRoleRepo, UserSessionRepo } from '~/repositories';
import { AdminLoginDto, UpdatePasswordDto } from '../dto';
import {
  buildPublicUser,
  normalizeEmail,
  normalizeLoginIdentifier,
  resolveDisplayName,
} from '../helpers';

const { JWT_EXPIRY, JWT_SECRET } = configEnv();

@Injectable()
export class AuthAdminService {
  constructor(
    private readonly userRepo: UserRepo,
    private readonly userProfileRepo: UserProfileRepo,
    private readonly userRoleRepo: UserRoleRepo,
    private readonly roleRepo: RoleRepo,
    private readonly userSessionRepo: UserSessionRepo,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  async login(dto: AdminLoginDto, ipAddress?: string, userAgent?: string) {
    const identifier = normalizeLoginIdentifier(dto.email);
    const email = normalizeEmail(dto.email);

    const user = await this.userRepo.findOne({
      where: [
        { email: ILike(email), isDeleted: false },
        { username: ILike(email), isDeleted: false },
        { phone: identifier, isDeleted: false },
      ],
      relations: {
        profile: true,
        userRoles: {
          role: true,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    const isMatch = await user.comparePassword(dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    if (user.isDeleted == true) {
      throw new UnauthorizedException('Tài khoản đã bị tạm khóa');
    }

    const roles = user.userRoles?.map(ur => ur.role?.code).filter(Boolean) || [];

    if (!user.isAdmin && roles.length === 0) {
      throw new ForbiddenException('Tài khoản chưa được phân quyền truy cập hệ thống quản trị');
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    const permissions = Array.from(
      new Set(
        user.userRoles?.flatMap(ur => ur.role?.permissionCodes || []) || [],
      ),
    );

    const payload = {
      userId: user.id,
      email: user.email,
      fullName: user.profile?.fullName,
      isAdmin: user.isAdmin,
      roles,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      expiresIn: JWT_EXPIRY || '1d',
    });

    const refreshTokenValue = randomBytes(64).toString('hex');
    const refreshTokenHash = createHash('sha256').update(refreshTokenValue).digest('hex');
    const session = await this.userSessionRepo.save(
      this.userSessionRepo.create({
        id: uuidv4(),
        userId: user.id,
        tokenHash: refreshTokenHash,
        familyId: uuidv4(),
        ipAddress,
        userAgent,
        deviceType: 'web',
        deviceInfoJson: { userAgent: userAgent || null, deviceType: 'web' },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        lastActivityAt: new Date(),
        createdBy: user.id,
      }),
    );

    await this.actionLogService.create({
      entityId: session.id,
      entityType: 'UserSessionEntity',
      actionType: enumData.ACTION_LOG.LOGIN.code,
      createdBy: user.id,
      actorCode: user.username || user.email,
      actorName: resolveDisplayName(user.profile, user) || user.email,
      description: `Đăng nhập cổng quản trị: ${user.email}`,
      dataBefore: '{}',
      dataAfter: JSON.stringify({
        sessionId: session.id,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      }),
    });

    return {
      message: 'Đăng nhập quản trị thành công',
      data: {
        user: buildPublicUser(user, user.profile, roles, permissions),
        sessionId: session.id,
        accessToken,
        refreshToken: refreshTokenValue,
        tokenType: 'Bearer',
        expiresIn: JWT_EXPIRY || '1d',
        tokens: {
          accessToken,
          refreshToken: refreshTokenValue,
          expiresIn: JWT_EXPIRY || '1d',
        },
      },
    };
  }

  async getInfoUser(currentUser: UserDto) {
    const user = await this.userRepo.findOne({
      where: { id: currentUser.id },
      relations: {
        profile: true,
        userRoles: {
          role: true,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin quản trị viên');
    }

    const roles = user.userRoles?.map(ur => ur.role?.code).filter(Boolean) || [];
    const permissions = Array.from(
      new Set(
        user.userRoles?.flatMap(ur => ur.role?.permissionCodes || []) || [],
      ),
    );

    return {
      message: this.i18n.commonTranslate('find_success'),
      data: {
        ...buildPublicUser(user, user.profile, roles, permissions),
        profile: transformKeys(user.profile),
      },
    };
  }

  async updatePassword(dto: UpdatePasswordDto, currentUser: UserDto) {
    const user = await this.userRepo.findOne({ where: { id: currentUser.id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Tài khoản đăng nhập bằng mạng xã hội, vui lòng đặt mật khẩu trước',
      );
    }
    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.userRepo.update(user.id, { passwordHash });

    return {
      message: 'Cập nhật mật khẩu thành công',
    };
  }

  async paginationUserSessions(currentUser: UserDto, body: PaginationDto<any>) {
    const { skip = 0, take = 20 } = body;
    const [sessions, total] = await this.userSessionRepo.findAndCount({
      where: { userId: currentUser.id, isRevoked: false },
      skip,
      take,
      order: { lastActivityAt: 'DESC' },
    });

    return {
      data: transformKeys(sessions),
      total,
      message: this.i18n.commonTranslate('find_success'),
    };
  }

  async removeToken(sessionId: string, currentUser: UserDto) {
    await this.userSessionRepo.update(
      { id: sessionId, userId: currentUser.id },
      { isRevoked: true },
    );
    return {
      message: 'Đã thu hồi phiên đăng nhập',
    };
  }

  async logout(user: UserDto) {
    await this.userSessionRepo.update({ userId: user.id, isRevoked: false }, { isRevoked: true });
    return { message: 'Đăng xuất thành công' };
  }

  async paginationUsers(body: PaginationDto<any>) {
    const { skip = 0, take = 20, where = {} } = body;
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.profile', 'profile')
      .where('u.isDeleted = :isDeleted', { isDeleted: where.isDeleted ?? false });
    if (where.keyword) {
      qb.andWhere('(LOWER(u.email) LIKE :kw OR LOWER(profile.fullName) LIKE :kw)', {
        kw: `%${String(where.keyword).trim().toLowerCase()}%`,
      });
    }
    const [data, total] = await qb.orderBy('u.createdAt', 'DESC').skip(skip).take(take || 20).getManyAndCount();
    return {
      data: data.map(item => ({
        id: item.id,
        email: item.email,
        username: item.username,
        isAdmin: item.isAdmin,
        fullName: item.profile?.fullName,
      })),
      total,
    };
  }

  getTokenId() {
    return uuidv4();
  }
}
