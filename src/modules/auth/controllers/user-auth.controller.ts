import { Body, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPatch, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard } from '~/common/guards';
import { UserDto } from '~/dto';
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
import { AuthUserService } from '../service/auth-user.service';
import { buildOAuthFrontendRedirect } from '../helpers';

@ApiTags('User - Auth')
@DefController('auth')
export class UserAuthController {
  constructor(private readonly service: AuthUserService) {}

  @ApiOperation({ summary: 'Đăng ký tài khoản học viên mới' })
  @DefPost('register')
  async register(@Body() data: UserRegisterDto, @Req() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.service.register(data, ipAddress, userAgent);
  }

  @ApiOperation({ summary: 'Đăng nhập học viên bằng email/mật khẩu' })
  @DefPost('login')
  async login(@Body() data: UserLoginDto, @Req() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.service.login(data, ipAddress, userAgent);
  }

  @ApiOperation({ summary: 'Làm mới Access Token bằng Refresh Token' })
  @DefPost('refresh-token')
  async refreshToken(@Body() data: RefreshTokenDto) {
    return await this.service.refreshToken(data);
  }

  @ApiOperation({ summary: 'Chuyển hướng đăng nhập Google OAuth' })
  @DefGet('google')
  async googleAuth(@Res() res: any) {
    const url = this.service.getGoogleAuthUrl();
    return res.redirect(url);
  }

  @ApiOperation({ summary: 'Callback xử lý đăng nhập Google OAuth' })
  @DefGet('google/callback')
  async googleAuthCallback(@Query('code') code: string, @Req() req: any, @Res() res: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      const result = await this.service.handleGoogleCallback(code, ipAddress, userAgent);
      return res.redirect(
        buildOAuthFrontendRedirect({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        }),
      );
    } catch (err: any) {
      return res.redirect(buildOAuthFrontendRedirect({ error: err?.message || 'OAuth error' }));
    }
  }

  @ApiOperation({ summary: 'Chuyển hướng đăng nhập Facebook OAuth' })
  @DefGet('facebook')
  async facebookAuth(@Res() res: any) {
    const url = this.service.getFacebookAuthUrl();
    return res.redirect(url);
  }

  @ApiOperation({ summary: 'Callback xử lý đăng nhập Facebook OAuth' })
  @DefGet('facebook/callback')
  async facebookAuthCallback(@Query('code') code: string, @Req() req: any, @Res() res: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      const result = await this.service.handleFacebookCallback(code, ipAddress, userAgent);
      return res.redirect(
        buildOAuthFrontendRedirect({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        }),
      );
    } catch (err: any) {
      return res.redirect(buildOAuthFrontendRedirect({ error: err?.message || 'OAuth error' }));
    }
  }

  @ApiOperation({ summary: 'Đăng nhập / Đăng ký qua Google OAuth SSO' })
  @DefPost('google-login')
  async googleLogin(@Body() data: GoogleLoginDto, @Req() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.service.googleLogin(data, ipAddress, userAgent);
  }

  @ApiOperation({ summary: 'Đăng nhập / Đăng ký qua Facebook OAuth' })
  @DefPost('facebook-login')
  async facebookLogin(@Body() data: FacebookLoginDto, @Req() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.service.facebookLogin(data, ipAddress, userAgent);
  }

  @ApiOperation({ summary: 'Gửi mã OTP qua email/số điện thoại' })
  @DefPost('send-otp')
  async sendOtp(@Body() data: SendOtpDto) {
    return await this.service.sendOtp(data);
  }

  @ApiOperation({ summary: 'Xác thực mã OTP' })
  @DefPost('verify-otp')
  async verifyOtp(@Body() data: VerifyOtpDto) {
    return await this.service.verifyOtp(data);
  }

  @ApiOperation({ summary: 'Đặt lại mật khẩu qua mã OTP' })
  @DefPost('reset-password')
  async resetPassword(@Body() data: ResetPasswordDto) {
    return await this.service.resetPassword(data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy thông tin tài khoản đang đăng nhập' })
  @DefGet('me')
  async getInfoUser(@CurrentUser() user: UserDto) {
    return await this.service.getInfoUser(user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật hồ sơ cá nhân' })
  @DefPatch('profile')
  async updateProfile(@CurrentUser() user: UserDto, @Body() dto: UpdateProfileDto) {
    return await this.service.updateProfile(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đổi mật khẩu tài khoản' })
  @DefPost('update-password')
  async updatePassword(@Body() info: UpdatePasswordDto, @CurrentUser() user: UserDto) {
    return await this.service.updatePassword(info, user);
  }

  @DefGet('get-token-id')
  async getTokenId() {
    return this.service.getTokenId();
  }
}
