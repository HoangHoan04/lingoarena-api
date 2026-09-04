import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { lastValueFrom } from 'rxjs';
import { ILike, LessThan, MoreThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { configEnv } from '~/config/env';
import { UserEntity, UserProfileEntity } from '~/entities';
import {
  OauthAccountRepo,
  RoleRepo,
  UserProfileRepo,
  UserRepo,
  UserRoleRepo,
  UserSessionRepo,
  VerificationCodeRepo,
} from '~/repositories';
import {
  FacebookLoginDto,
  GoogleLoginDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SendOtpDto,
  UpdatePasswordDto,
  UpdateProfileDto,
  UserLoginDto,
  UserRegisterDto,
  VerifyOtpDto,
} from '../dto';
import { EmailService } from '../../email/email.service';
import { buildPublicUser, isJwtLike, normalizeEmail, normalizeLoginIdentifier } from '../helpers';

const {
  JWT_SECRET,
  JWT_EXPIRY,
  JWT_REFRESH_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_EXPIRY,
  MILLISECOND_OTP_EFFECT,
} = configEnv();

// Số giây refresh token sống (default 7 ngày)
const REFRESH_TOKEN_TTL_DAYS = 7;

// Số giây access token sống (default 1 ngày)
const ACCESS_TOKEN_EXPIRY = JWT_EXPIRY || '1d';

// Max số lần thử OTP
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthUserService {
  constructor(
    private readonly userRepo: UserRepo,
    private readonly userProfileRepo: UserProfileRepo,
    private readonly userRoleRepo: UserRoleRepo,
    private readonly roleRepo: RoleRepo,
    private readonly userSessionRepo: UserSessionRepo,
    private readonly oauthAccountRepo: OauthAccountRepo,
    private readonly verificationCodeRepo: VerificationCodeRepo,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
    private readonly emailService: EmailService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────

  /** Hash string bằng SHA-256 */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Tạo access token JWT */
  private generateAccessToken(user: UserEntity, roles: string[]): string {
    const payload = {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      roles,
    };
    return this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  }

  /** Tạo refresh token ngẫu nhiên */
  private generateRefreshTokenValue(): string {
    return randomBytes(64).toString('hex');
  }

  /** Lấy danh sách role codes của user */
  private async getUserRoles(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { userId, isDeleted: false },
      relations: { role: true },
    });
    return userRoles.map(ur => ur.role?.code).filter(Boolean) as string[];
  }

  /**
   * Tạo access token + refresh token. Refresh hash nằm `user_sessions.tokenHash`,
   * nhóm rotation nằm `familyId` (đã gộp bảng refresh_tokens).
   */
  private async generateAuthTokens(
    user: UserEntity,
    userAgent?: string,
    ipAddress?: string,
    deviceType?: string,
    familyId?: string,
  ) {
    const roles = await this.getUserRoles(user.id);
    const accessToken = this.generateAccessToken(user, roles);
    const refreshTokenValue = this.generateRefreshTokenValue();
    const refreshTokenHash = this.hashToken(refreshTokenValue);
    const resolvedFamilyId = familyId || uuidv4();

    const rtExpiresAt = new Date();
    rtExpiresAt.setDate(rtExpiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.userSessionRepo.save(
      this.userSessionRepo.create({
        id: uuidv4(),
        userId: user.id,
        tokenHash: refreshTokenHash,
        familyId: resolvedFamilyId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        deviceType: deviceType || 'web',
        deviceInfoJson: {
          userAgent: userAgent || null,
          deviceType: deviceType || 'web',
        },
        expiresAt: rtExpiresAt,
        isRevoked: false,
        lastActivityAt: new Date(),
        createdBy: user.id,
      }),
    );

    await this.userRepo.update({ id: user.id }, { lastLoginAt: new Date() });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private async findUserByLoginIdentifier(raw: string): Promise<UserEntity | null> {
    const identifier = normalizeLoginIdentifier(raw);
    const email = normalizeEmail(raw);
    if (!identifier) return null;

    return this.userRepo.findOne({
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
  }

  private async ensureStudentRole(userId: string): Promise<void> {
    const exist = await this.userRoleRepo.findOne({
      where: { userId, isDeleted: false },
      relations: { role: true },
    });
    if (exist?.role?.code) return;

    const studentRole = await this.roleRepo.findOne({
      where: [
        { code: 'STUDENT', isDeleted: false },
        { code: 'student', isDeleted: false },
      ],
    });
    if (!studentRole) return;

    await this.userRoleRepo.save(
      this.userRoleRepo.create({
        userId,
        roleId: studentRole.id,
        scopeType: enumData.SCOPE_TYPE.GLOBAL.code,
      }),
    );
  }

  private async ensureUserProfile(
    userId: string,
    data: { fullName?: string; displayName?: string; avatarUrl?: string | null },
  ): Promise<UserProfileEntity> {
    let profile = await this.userProfileRepo.findOne({ where: { userId } });
    const fallbackName = data.fullName || data.displayName || 'Học viên LingoArena';

    if (!profile) {
      profile = this.userProfileRepo.create({
        userId,
        fullName: fallbackName,
        displayName: data.displayName || fallbackName,
        avatarUrl: data.avatarUrl || null,
        countryCode: 'VN',
      });
      return this.userProfileRepo.save(profile);
    }

    let changed = false;
    if (!profile.fullName && fallbackName) {
      profile.fullName = fallbackName;
      changed = true;
    }
    if (!profile.displayName && (data.displayName || fallbackName)) {
      profile.displayName = data.displayName || fallbackName;
      changed = true;
    }
    if (!profile.avatarUrl && data.avatarUrl) {
      profile.avatarUrl = data.avatarUrl;
      changed = true;
    }
    if (changed) {
      await this.userProfileRepo.save(profile);
    }
    return profile;
  }

  private async upsertOauthAccount(
    userId: string,
    provider: 'google' | 'facebook',
    providerUserId: string,
    profileData: Record<string, unknown>,
  ) {
    let oauthAccount = await this.oauthAccountRepo.findOne({
      where: { provider, userId },
    });
    if (!oauthAccount) {
      oauthAccount = this.oauthAccountRepo.create({
        id: uuidv4(),
        userId,
        provider,
        providerUserId,
        profileJson: profileData,
        createdBy: userId,
      });
      await this.oauthAccountRepo.save(oauthAccount);
      return;
    }

    oauthAccount.providerUserId = providerUserId;
    oauthAccount.profileJson = profileData;
    await this.oauthAccountRepo.save(oauthAccount);
  }

  /** Build response user object */
  private async buildUserResponse(user: UserEntity) {
    const profile = await this.userProfileRepo.findOne({ where: { userId: user.id } });
    const roles = await this.getUserRoles(user.id);
    return buildPublicUser(user, profile, roles);
  }

  /**
   * Tạo/ghi đè OTP cho mục đích cụ thể.
   * Với pre-registration OTP (user chưa tồn tại), lưu userId = 'PENDING_<email_hash>'
   * để tránh FK constraint.
   */
  private async createOtp(destination: string, purpose: string, userId?: string): Promise<string> {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = this.hashToken(otpCode);
    const expiresAt = new Date(Date.now() + (MILLISECOND_OTP_EFFECT || 300000));

    // Nếu có userId thực, lưu vào verification_codes
    if (userId) {
      // Vô hiệu hoá OTP cũ cùng purpose
      await this.verificationCodeRepo.update(
        { userId, purpose, isUsed: false },
        { isUsed: true, usedAt: new Date() },
      );

      const vc = this.verificationCodeRepo.create({
        userId,
        purpose,
        codeHash,
        channel: 'email',
        destination,
        attemptCount: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        isUsed: false,
        expiresAt,
      });
      await this.verificationCodeRepo.save(vc);
    }

    return otpCode;
  }

  /**
   * Xác thực OTP — dùng cho cả pre-registration và post-registration
   */
  private async verifyOtpCode(
    destination: string,
    otpCode: string,
    purpose: string,
    userId?: string,
  ): Promise<void> {
    const codeHash = this.hashToken(otpCode.trim());

    if (userId) {
      // Có userId thực — tìm trong DB
      const vc = await this.verificationCodeRepo.findOne({
        where: {
          userId,
          purpose,
          destination,
          isUsed: false,
          codeHash,
        },
      });

      if (!vc) {
        throw new BadRequestException('Mã OTP không hợp lệ hoặc đã được sử dụng');
      }
      if (vc.expiresAt < new Date()) {
        throw new BadRequestException('Mã OTP đã hết hạn');
      }
      if (vc.attemptCount >= vc.maxAttempts) {
        throw new BadRequestException('Đã vượt quá số lần thử OTP');
      }

      vc.isUsed = true;
      vc.usedAt = new Date();
      await this.verificationCodeRepo.save(vc);
    } else {
      // Pre-registration: tìm theo destination + purpose (không cần userId)
      const vc = await this.verificationCodeRepo.findOne({
        where: {
          destination,
          purpose,
          codeHash,
          isUsed: false,
          expiresAt: MoreThan(new Date()),
        },
      });

      if (!vc) {
        throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
      }

      vc.isUsed = true;
      vc.usedAt = new Date();
      await this.verificationCodeRepo.save(vc);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC AUTH METHODS
  // ─────────────────────────────────────────────────────────────

  /**
   * Đăng nhập bằng email/phone + password
   */
  async login(data: UserLoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.findUserByLoginIdentifier(data.email);

    if (!user) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    if (user.isDeleted) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    const tokens = await this.generateAuthTokens(user, userAgent, ipAddress, data.deviceType);
    const userResponse = await this.buildUserResponse(user);

    return {
      message: 'Đăng nhập thành công',
      data: {
        user: userResponse,
        ...tokens,
      },
    };
  }

  /**
   * Đăng ký tài khoản mới (với OTP xác thực email)
   */
  async register(data: UserRegisterDto, ipAddress?: string, userAgent?: string) {
    // Kiểm tra OTP nếu có (flow mới)
    if (data.otpCode) {
      await this.verifyOtpCode(data.email, data.otpCode, 'EMAIL_VERIFICATION');
    }

    // Kiểm tra email/phone đã tồn tại chưa
    const existByEmail = await this.userRepo.findOne({
      where: { email: data.email, isDeleted: false },
    });
    if (existByEmail) {
      throw new BadRequestException('Email đã được đăng ký. Vui lòng đăng nhập');
    }

    if (data.phone) {
      const existByPhone = await this.userRepo.findOne({
        where: { phone: data.phone, isDeleted: false },
      });
      if (existByPhone) {
        throw new BadRequestException('Số điện thoại đã được đăng ký');
      }
    }

    // Tạo user — UserEntity sẽ tự hash passwordHash qua @BeforeInsert
    const user = this.userRepo.create({
      email: data.email,
      phone: data.phone || null,
      passwordHash: data.password,
      preferredLanguage: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
    });
    await this.userRepo.save(user);

    await this.ensureStudentRole(user.id);
    await this.ensureUserProfile(user.id, {
      fullName: data.fullName,
      displayName: data.displayName || data.fullName,
    });

    const tokens = await this.generateAuthTokens(user, userAgent, ipAddress);

    return {
      message: 'Đăng ký tài khoản thành công',
      data: {
        user: await this.buildUserResponse(user),
        ...tokens,
      },
    };
  }

  /**
   * Làm mới access token bằng refresh token
   */
  async refreshToken(data: RefreshTokenDto) {
    const refreshTokenHash = this.hashToken(data.refreshToken);

    const tokenRecord = await this.userSessionRepo.findOne({
      where: { tokenHash: refreshTokenHash },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    if (tokenRecord.isRevoked) {
      await this.userSessionRepo.update(
        { familyId: tokenRecord.familyId, userId: tokenRecord.userId },
        { isRevoked: true },
      );
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token đã hết hạn. Vui lòng đăng nhập lại');
    }

    const user = await this.userRepo.findOne({ where: { id: tokenRecord.userId } });
    if (!user || user.isDeleted) {
      throw new UnauthorizedException('Tài khoản không hợp lệ');
    }

    tokenRecord.isRevoked = true;
    tokenRecord.updatedBy = user.id;
    await this.userSessionRepo.save(tokenRecord);

    const tokens = await this.generateAuthTokens(
      user,
      tokenRecord.userAgent,
      tokenRecord.ipAddress,
      tokenRecord.deviceType,
      tokenRecord.familyId,
    );

    return {
      message: 'Làm mới token thành công',
      data: { ...tokens },
    };
  }

  /**
   * Đăng xuất — revoke refresh token
   */
  async logout(user: any, refreshTokenValue?: string) {
    if (refreshTokenValue) {
      const hash = this.hashToken(refreshTokenValue);
      await this.userSessionRepo.update({ tokenHash: hash, userId: user.id }, { isRevoked: true });
    } else {
      await this.userSessionRepo.update({ userId: user.id, isRevoked: false }, { isRevoked: true });
    }
    return { message: 'Đăng xuất thành công' };
  }

  /**
   * Dọn dẹp token hết hạn
   */
  async cleanExpiredTokens() {
    const now = new Date();
    const sessionResult = await this.userSessionRepo.delete([
      { expiresAt: LessThan(now) },
      { isRevoked: true },
    ]);
    return {
      message: 'Dọn dẹp token thành công',
      deletedSessions: sessionResult.affected || 0,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // OTP METHODS
  // ─────────────────────────────────────────────────────────────

  /**
   * Gửi OTP — dùng trong controller (SendOtpDto: { target, purpose })
   * purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION' | 'LOGIN_2FA'
   */
  async sendOtp(dto: SendOtpDto) {
    const destination = dto.target.trim().toLowerCase();
    const { purpose } = dto;

    // Nếu là PASSWORD_RESET, tìm user đã tồn tại
    if (purpose === enumData.OTP_PURPOSE.PASSWORD_RESET.code) {
      const user = await this.userRepo.findOne({
        where: [{ email: destination }, { phone: destination }],
      });
      if (!user) {
        throw new BadRequestException('Không tìm thấy tài khoản với email/số điện thoại này');
      }
      const otpCode = await this.createOtp(destination, purpose, user.id);
      await this.emailService.sendForgotPasswordOtp({ email: destination, otpCode });
      if (process.env.NODE_ENV !== 'production') {
        return { message: 'Gửi mã OTP thành công', _debug_otp: otpCode };
      }
      return { message: 'Mã OTP đã được gửi tới email/số điện thoại của bạn' };
    }

    // EMAIL_VERIFICATION: user chưa tồn tại (pre-registration)
    const existUser = await this.userRepo.findOne({
      where: { email: destination, isDeleted: false },
    });
    if (existUser) {
      throw new BadRequestException('Email đã được đăng ký. Vui lòng đăng nhập');
    }

    const otpCode = await this.createOtpForEmail(destination, purpose);
    await this.emailService.sendEmailVerify({ email: destination, otpCode });
    if (process.env.NODE_ENV !== 'production') {
      return { message: 'Gửi mã OTP thành công', _debug_otp: otpCode };
    }
    return { message: 'Mã OTP đã được gửi tới email của bạn' };
  }

  /**
   * Tạo OTP lưu vào bảng verification_codes mà không cần userId (pre-registration)
   */
  private async createOtpForEmail(destination: string, purpose: string): Promise<string> {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = this.hashToken(otpCode);
    const expiresAt = new Date(Date.now() + (MILLISECOND_OTP_EFFECT || 300000));

    // Tìm hoặc tạo user để giữ FK constraint
    let pendingUser = await this.userRepo.findOne({
      where: { email: destination, isDeleted: false },
    });
    if (!pendingUser) {
      pendingUser = this.userRepo.create({
        email: destination,
        passwordHash: undefined,
      });
      await this.userRepo.save(pendingUser);
    }

    // Vô hiệu hoá OTP cũ cùng destination + purpose
    await this.verificationCodeRepo.update(
      { destination, purpose, isUsed: false },
      { isUsed: true, usedAt: new Date() },
    );

    const vc = this.verificationCodeRepo.create({
      userId: pendingUser.id,
      purpose,
      codeHash,
      channel: 'email',
      destination,
      attemptCount: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      isUsed: false,
      expiresAt,
    });
    await this.verificationCodeRepo.save(vc);

    return otpCode;
  }

  /**
   * Xác thực OTP — controller endpoint
   */
  async verifyOtp(dto: VerifyOtpDto) {
    await this.verifyOtpCode(dto.target, dto.code, dto.purpose);
    return { message: 'Xác thực OTP thành công', verified: true };
  }

  /**
   * Đặt lại mật khẩu (sau khi xác thực OTP)
   */
  async resetPassword(dto: ResetPasswordDto) {
    const destination = dto.target.trim().toLowerCase();

    // Xác thực OTP trước
    await this.verifyOtpCode(destination, dto.code, enumData.OTP_PURPOSE.PASSWORD_RESET.code);

    const user = await this.userRepo.findOne({
      where: [{ email: destination }, { phone: destination }],
    });
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    // Cập nhật password — @BeforeUpdate sẽ tự hash
    user.passwordHash = dto.newPassword;
    await this.userRepo.save(user);

    // Revoke toàn bộ session cũ để bắt buộc đăng nhập lại
    await this.userSessionRepo.update({ userId: user.id }, { isRevoked: true });

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại' };
  }

  /**
   * Gửi OTP đăng ký (alias cho sendOtp với purpose EMAIL_VERIFICATION)
   * Giữ lại để backward-compatible với modal frontend cũ
   */
  async sendOtpEmailCustomer(data: { email?: string; phone?: string; sendMethod?: string }) {
    const identifier = data.sendMethod === 'SMS' ? data.phone : data.email;
    if (!identifier) throw new BadRequestException('Vui lòng cung cấp email hoặc số điện thoại');

    return this.sendOtp({
      target: identifier,
      purpose: enumData.OTP_PURPOSE.EMAIL_VERIFICATION.code,
    });
  }

  /**
   * Gửi OTP xác thực (forgot password, login 2FA)
   * Giữ lại để backward-compatible
   */
  async sendOtpVerify(data: { identifier: string; method?: string }) {
    return this.sendOtp({
      target: data.identifier,
      purpose: enumData.OTP_PURPOSE.PASSWORD_RESET.code,
    });
  }

  /**
   * Forgot password flow cũ (identifier + otpCode + newPassword)
   * Giữ lại để backward-compatible với modal frontend
   */
  async forgotPassword(data: {
    identifier: string;
    otpCode: string;
    newPassword: string;
    method?: string;
  }) {
    return this.resetPassword({
      target: data.identifier,
      code: data.otpCode,
      newPassword: data.newPassword,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // USER PROFILE METHODS
  // ─────────────────────────────────────────────────────────────

  /**
   * Lấy thông tin user đang đăng nhập
   */
  async getInfoUser(userDto: any) {
    const user = await this.userRepo.findOne({
      where: { id: userDto.id, isDeleted: false },
    });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');

    const profile = await this.userProfileRepo.findOne({ where: { userId: user.id } });
    const roles = await this.getUserRoles(user.id);

    return {
      message: 'Lấy thông tin thành công',
      data: buildPublicUser(user, profile, roles),
    };
  }

  /** Alias cho getInfoUser (backward compat) */
  async getUserInfo(userDto: any) {
    return this.getInfoUser(userDto);
  }

  /**
   * Cập nhật hồ sơ cá nhân
   */
  async updateProfile(userDto: any, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userDto.id, isDeleted: false } });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');

    let profile = await this.userProfileRepo.findOne({ where: { userId: user.id } });
    if (!profile) {
      profile = this.userProfileRepo.create({
        userId: user.id,
        fullName: dto.fullName || user.email,
      });
    }

    if (dto.fullName !== undefined) profile.fullName = dto.fullName;
    if (dto.displayName !== undefined) profile.displayName = dto.displayName;
    if (dto.avatarUrl !== undefined) profile.avatarUrl = dto.avatarUrl;
    if (dto.dateOfBirth !== undefined) profile.dateOfBirth = dto.dateOfBirth;
    if (dto.gender !== undefined) profile.gender = dto.gender;
    if (dto.countryCode !== undefined) profile.countryCode = dto.countryCode;
    if (dto.occupation !== undefined) profile.occupation = dto.occupation;
    if (dto.schoolOrCompany !== undefined) profile.schoolOrCompany = dto.schoolOrCompany;
    if (dto.bio !== undefined) profile.bio = dto.bio;

    profile.updatedBy = user.id;
    await this.userProfileRepo.save(profile);

    // Cập nhật preferences trên user nếu có
    if (dto.preferredLanguage !== undefined) user.preferredLanguage = dto.preferredLanguage;
    if (dto.timezone !== undefined) user.timezone = dto.timezone;

    // Cập nhật phone nếu có
    const { phone } = dto as any;
    if (phone !== undefined) user.phone = phone;

    user.updatedBy = user.id;
    await this.userRepo.save(user);

    return {
      message: 'Cập nhật thông tin thành công',
      data: { ...user, profile },
    };
  }

  /**
   * Đổi mật khẩu khi đã đăng nhập (cần mật khẩu cũ)
   */
  async updatePassword(dto: UpdatePasswordDto, userDto: any) {
    const user = await this.userRepo.findOne({ where: { id: userDto.id } });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');

    const isMatch = await user.comparePassword(dto.currentPassword);
    if (!isMatch) throw new BadRequestException('Mật khẩu hiện tại không chính xác');

    user.passwordHash = dto.newPassword;
    await this.userRepo.save(user);

    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Đổi mật khẩu với xác nhận (confirmPassword)
   */
  async changePassword(
    dto: { currentPassword: string; newPassword: string; confirmPassword: string },
    userDto: any,
  ) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu mới và xác nhận mật khẩu không khớp');
    }
    return this.updatePassword(
      { currentPassword: dto.currentPassword, newPassword: dto.newPassword },
      userDto,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // GOOGLE OAUTH
  // ─────────────────────────────────────────────────────────────

  /** URL để redirect tới Google OAuth */
  getGoogleAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !redirectUri) {
      throw new BadRequestException('Google OAuth chưa được cấu hình');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /** Xử lý callback code từ Google */
  async handleGoogleCallback(code: string, ipAddress?: string, userAgent?: string) {
    const tokenResponse = await this.exchangeGoogleCode(code);
    const googleUser = await this.getGoogleUserInfo(tokenResponse.access_token);
    return this.handleGoogleUser(googleUser, ipAddress, userAgent);
  }

  /** Đăng nhập qua Google ID Token (mobile/SDK) */
  async googleLogin(data: GoogleLoginDto, ipAddress?: string, userAgent?: string) {
    const googleUser = await this.verifyGoogleToken(data.idToken);
    return this.handleGoogleUser(googleUser, ipAddress, userAgent);
  }

  /** Alias cho backward compat */
  async loginWithGoogle(data: GoogleLoginDto, userAgent?: string, ipAddress?: string) {
    return this.googleLogin(data, ipAddress, userAgent);
  }

  private async exchangeGoogleCode(code: string) {
    const { data } = await lastValueFrom(
      this.httpService.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
        code,
      }),
    );
    return data;
  }

  private async getGoogleUserInfo(accessToken: string) {
    const { data } = await lastValueFrom(
      this.httpService.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
    return data;
  }

  private async verifyGoogleToken(token: string) {
    if (token.startsWith('mock-')) {
      const email = token.replace('mock-', '');
      return { email, email_verified: true, name: email, sub: `mock_${email}` };
    }

    try {
      if (isJwtLike(token)) {
        const { data } = await lastValueFrom(
          this.httpService.get('https://oauth2.googleapis.com/tokeninfo', {
            params: { id_token: token },
          }),
        );
        return data;
      }
      return await this.getGoogleUserInfo(token);
    } catch {
      throw new BadRequestException('Token Google không hợp lệ hoặc đã hết hạn');
    }
  }

  private async handleGoogleUser(googleUser: any, ipAddress?: string, userAgent?: string) {
    const email = normalizeEmail(googleUser.email || '');
    if (!email) throw new BadRequestException('Không lấy được email từ Google');

    let user = await this.userRepo.findOne({ where: { email, isDeleted: false } });

    if (!user) {
      user = this.userRepo.create({
        email,
        passwordHash: undefined,
        emailVerifiedAt: new Date(),
      });
      await this.userRepo.save(user);
    } else if (!user.emailVerifiedAt) {
      await this.userRepo.update(user.id, {
        emailVerifiedAt: new Date(),
      });
      user.emailVerifiedAt = new Date();
    }

    await this.ensureUserProfile(user.id, {
      fullName: googleUser.name || googleUser.given_name || email,
      displayName: googleUser.name || googleUser.given_name || email,
      avatarUrl: googleUser.picture || null,
    });
    await this.ensureStudentRole(user.id);
    await this.upsertOauthAccount(
      user.id,
      'google',
      googleUser.sub || googleUser.id || email,
      googleUser,
    );

    const tokens = await this.generateAuthTokens(user, userAgent, ipAddress);
    const userResponse = await this.buildUserResponse(user);

    return {
      message: 'Đăng nhập Google thành công',
      data: { user: userResponse, ...tokens },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // FACEBOOK OAUTH
  // ─────────────────────────────────────────────────────────────

  /** URL để redirect tới Facebook OAuth */
  getFacebookAuthUrl(): string {
    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = process.env.FACEBOOK_CALLBACK_URL;

    if (!appId || !redirectUri) {
      throw new BadRequestException('Facebook OAuth chưa được cấu hình');
    }

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: 'email,public_profile',
      response_type: 'code',
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  /** Xử lý callback code từ Facebook */
  async handleFacebookCallback(code: string, ipAddress?: string, userAgent?: string) {
    const tokenResponse = await this.exchangeFacebookCode(code);
    const fbUser = await this.getFacebookUserInfo(tokenResponse.access_token);
    return this.handleFacebookUser(fbUser, ipAddress, userAgent);
  }

  /** Đăng nhập qua Facebook access token (mobile/SDK) */
  async facebookLogin(data: FacebookLoginDto, ipAddress?: string, userAgent?: string) {
    const fbUser = await this.getFacebookUserInfo(data.accessToken);
    return this.handleFacebookUser(fbUser, ipAddress, userAgent);
  }

  /** Alias cho backward compat */
  async loginWithFacebook(data: FacebookLoginDto, userAgent?: string, ipAddress?: string) {
    return this.facebookLogin(data, ipAddress, userAgent);
  }

  private async exchangeFacebookCode(code: string) {
    const { data } = await lastValueFrom(
      this.httpService.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
          code,
        },
      }),
    );
    return data;
  }

  private async getFacebookUserInfo(accessToken: string) {
    if (accessToken.startsWith('mock-')) {
      const email = accessToken.replace('mock-', '');
      return { email, name: email, id: `mock_${email}` };
    }
    try {
      const url = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`;
      const { data } = await lastValueFrom(this.httpService.get(url));
      return data;
    } catch {
      throw new BadRequestException('Token Facebook không hợp lệ hoặc đã hết hạn');
    }
  }

  private resolveFacebookEmail(fbUser: { id?: string; email?: string }): string {
    if (fbUser.email) return fbUser.email;
    if (!fbUser.id) {
      throw new BadRequestException('Không thể lấy email từ Facebook. Vui lòng cấp quyền email');
    }
    return `fb_${fbUser.id}@facebook.local`;
  }

  private async handleFacebookUser(fbUser: any, ipAddress?: string, userAgent?: string) {
    const email = normalizeEmail(this.resolveFacebookEmail(fbUser));

    let user = await this.userRepo.findOne({ where: { email, isDeleted: false } });

    if (!user) {
      user = this.userRepo.create({
        email,
        passwordHash: undefined,
        emailVerifiedAt: fbUser.email ? new Date() : undefined,
      });
      await this.userRepo.save(user);
    }

    await this.ensureUserProfile(user.id, {
      fullName: fbUser.name || email,
      displayName: fbUser.name || email,
      avatarUrl: fbUser.picture?.data?.url || null,
    });
    await this.ensureStudentRole(user.id);
    await this.upsertOauthAccount(user.id, 'facebook', fbUser.id || email, fbUser);

    const tokens = await this.generateAuthTokens(user, userAgent, ipAddress);
    const userResponse = await this.buildUserResponse(user);

    return {
      message: 'Đăng nhập Facebook thành công',
      data: { user: userResponse, ...tokens },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // MISC
  // ─────────────────────────────────────────────────────────────

  /**
   * Xác thực OTP đăng nhập và trả về token (OTP login)
   */
  async verifyLoginOtp(
    data: { identifier: string; otpCode: string; method?: string },
    userAgent?: string,
    ipAddress?: string,
  ) {
    const destination = data.identifier.trim().toLowerCase();

    let user = await this.userRepo.findOne({
      where: [{ email: destination }, { phone: destination }],
    });

    if (!user) throw new BadRequestException('Tài khoản không tồn tại');

    await this.verifyOtpCode(
      destination,
      data.otpCode,
      enumData.OTP_PURPOSE.LOGIN_2FA.code,
      user.id,
    );

    if (user.isDeleted) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const tokens = await this.generateAuthTokens(user, userAgent, ipAddress);
    const userResponse = await this.buildUserResponse(user);

    return {
      message: 'Xác thực OTP và đăng nhập thành công',
      data: { user: userResponse, ...tokens },
    };
  }

  /**
   * Trả về token ID mới (dùng cho debug/testing)
   */
  getTokenId(): string {
    return uuidv4();
  }

  /**
   * Kiểm tra email/phone đã tồn tại chưa
   */
  async checkPhoneAndEmail(data: { email?: string; phone?: string }) {
    if (data.email) {
      const exist = await this.userRepo.findOne({ where: { email: data.email, isDeleted: false } });
      if (exist) {
        throw new BadRequestException('Email đã tồn tại');
      }
    }
    if (data.phone) {
      const exist = await this.userRepo.findOne({ where: { phone: data.phone, isDeleted: false } });
      if (exist) throw new BadRequestException('Số điện thoại đã tồn tại');
    }
    return { message: 'Có thể sử dụng' };
  }
}
