import { Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DefController, DefPost } from '~/common/core/decorator';
import { ZaloService } from './zalo.service';

@ApiTags('User - Zalo')
@DefController('zalo')
export class ZaloController {
  constructor(private service: ZaloService) {}

  @ApiOperation({ summary: 'Gửi zalo otp' })
  @DefPost('send-otp')
  async sendOtpCode(@Body() data: { phone: string; otpCode: string }): Promise<any> {
    return await this.service.sendOtpCode(data);
  }

  @ApiOperation({ summary: 'Lấy access token' })
  @DefPost('get-access-token')
  async getAccessTokenWithFreshToken(): Promise<any> {
    return await this.service.getAccessTokenWithFreshToken('feature_system_3');
  }
}
