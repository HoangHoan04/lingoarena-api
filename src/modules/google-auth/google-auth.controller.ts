import { Controller, Get, Ip, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { buildOAuthFrontendRedirect } from '../auth/helpers';
import { AuthUserService } from '../auth/service/auth-user.service';

@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly authService: AuthUserService) {}

  @Get('callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Req() req: Request,
    @Res() res: Response,
    @Ip() ipAddress: string,
  ) {
    if (error) {
      return res.redirect(buildOAuthFrontendRedirect({ error }));
    }

    try {
      const result = await this.authService.handleGoogleCallback(
        code,
        ipAddress,
        req.headers['user-agent'],
      );
      return res.redirect(
        buildOAuthFrontendRedirect({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        }),
      );
    } catch (err: any) {
      return res.redirect(
        buildOAuthFrontendRedirect({
          error: err.message || 'Google đăng nhập thất bại',
        }),
      );
    }
  }
}
