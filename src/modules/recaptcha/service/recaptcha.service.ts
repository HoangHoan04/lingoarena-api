import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RecaptchaService {
  constructor(private readonly http: HttpService) {}

  async verify(token: string, remoteip?: string) {
    const secret = process.env.RECAPTCHA_SECRET;
    if (!secret || !token) return null;

    const { data } = await firstValueFrom(
      this.http.post<VerifyRes>(
        'https://www.google.com/recaptcha/api/siteverify',
        new URLSearchParams({
          secret,
          response: token,
          ...(remoteip ? { remoteip } : {}),
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      ),
    );

    if (!data.success) {
      throw new BadRequestException({
        code: 'captcha_failed',
        errors: data['error-codes'] ?? [],
      });
    }

    return { hostname: data.hostname, challengeTs: data.challenge_ts };
  }
}
