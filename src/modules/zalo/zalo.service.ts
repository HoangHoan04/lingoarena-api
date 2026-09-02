import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ActionLogService } from '../action-log/action-log.service';

@Injectable()
export class ZaloService {
  constructor(
    private httpService: HttpService,
    private actionLogService: ActionLogService,
  ) {}

  private callApi(url: string, data: any, config: any) {
    return new Promise((resolve, reject) => {
      const request = this.httpService.post(url, data, { headers: config });
      lastValueFrom(request)
        .then(res => {
          resolve(res.data);
        })
        .catch((err: any) => {
          console.log(err);
          throw err;
        });
    });
  }

  public async getAccessTokenWithFreshToken(username: string) {}

  public async sendOtpCode(data: { phone: string; otpCode: string }) {}

  async autoUpdateAccessToken() {}
}
