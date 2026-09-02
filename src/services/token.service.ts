import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(payload: { sub: string; email: string; role?: string }): string {
    return this.jwtService.sign(payload);
  }

  generateRefreshToken(): string {
    return crypto.randomUUID();
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  compareToken(plainToken: string, hashedToken: string): boolean {
    return this.hashToken(plainToken) === hashedToken;
  }

  verifyAccessToken(token: string): {
    sub: string;
    email: string;
    role: string;
  } {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }
}
