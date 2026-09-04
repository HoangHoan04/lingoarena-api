import { Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { AdminLoginDto, UpdatePasswordDto } from '../dto';
import { AuthAdminService } from '../service/auth-admin.service';

@ApiTags('Admin - Auth')
@DefController('auth')
export class AdminAuthController {
  constructor(private readonly service: AuthAdminService) {}

  @ApiOperation({ summary: 'Đăng nhập trang quản trị' })
  @DefPost('login')
  async login(@Body() data: AdminLoginDto, @Req() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.service.login(data, ipAddress, userAgent);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiOperation({ summary: 'Lấy thông tin tài khoản quản trị hiện tại' })
  @DefGet('me')
  async getInfoUser(@CurrentUser() user: UserDto) {
    return await this.service.getInfoUser(user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiOperation({ summary: 'Cập nhật mật khẩu tài khoản quản trị' })
  @DefPost('update-password')
  async updatePassword(@Body() info: UpdatePasswordDto, @CurrentUser() user: UserDto) {
    return await this.service.updatePassword(info, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiOperation({ summary: 'Lấy danh sách các phiên đăng nhập' })
  @DefPost('sessions')
  async paginationUserSessions(@CurrentUser() user: UserDto, @Body() body: PaginationDto<any>) {
    return await this.service.paginationUserSessions(user, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiOperation({ summary: 'Thu hồi phiên đăng nhập theo ID' })
  @DefPost('sessions/:id/revoke')
  async revokeSession(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return await this.service.removeToken(id, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiOperation({ summary: 'Đăng xuất quản trị' })
  @DefPost('logout')
  async logout(@CurrentUser() user: UserDto) {
    return await this.service.logout(user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiOperation({ summary: 'Phân trang người dùng' })
  @DefPost('users/pagination')
  async paginationUsers(@Body() body: PaginationDto<any>) {
    return await this.service.paginationUsers(body);
  }

  @DefGet('get-token-id')
  async getTokenId() {
    return this.service.getTokenId();
  }
}
