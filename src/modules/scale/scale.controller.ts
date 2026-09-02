import { Body, Post } from '@nestjs/common';
import { DefController, DefPost } from '~/common/core/decorator';
import { ScaleService } from './scale.service';

@DefController('')
export class ScaleController {
  constructor(private readonly service: ScaleService) {}

  @DefPost('every-minute')
  public async autoRunEveryMinute(@Body() data: { keySecret: string }) {
    if (!data.keySecret) return null;
    else {
      if (data.keySecret !== process.env.KEY_SECRET) return null;
    }
    return await this.service.autoRunEveryMinute();
  }

  @DefPost('mid-night')
  public async autoRunMidNight(@Body() data: { keySecret: string }) {
    if (!data.keySecret) return null;
    else {
      if (data.keySecret !== process.env.KEY_SECRET) return null;
    }
    return await this.service.autoRunMidNight();
  }

  @DefPost('23h-every-day')
  public async autoRun23hEveryDay(@Body() data: { keySecret: string }) {
    if (!data.keySecret) return null;
    else {
      if (data.keySecret !== process.env.KEY_SECRET) return null;
    }
    return await this.service.autoRun23hEveryDay();
  }

  @DefPost('every-10-minutes')
  public async autoRunEvery10Minutes(@Body() data: { keySecret: string }) {
    if (!data.keySecret) return null;
    else {
      if (data.keySecret !== process.env.KEY_SECRET) return null;
    }
    return await this.service.autoRunEvery10Minutes();
  }

  @DefPost('every-end-of-month')
  public async autoRunEveryEndOfMonth(@Body() data: { keySecret: string }) {
    if (!data.keySecret) return null;
    else {
      if (data.keySecret !== process.env.KEY_SECRET) return null;
    }
    return await this.service.autoRunEveryEndOfMonth();
  }

  @DefPost('every-year')
  public async autoRunEveryYear(@Body() data: { keySecret: string }) {
    if (!data.keySecret) return null;
    else {
      if (data.keySecret !== process.env.KEY_SECRET) return null;
    }
    return await this.service.autoRunEveryYear();
  }

  @DefPost('1-am')
  public async autoRunAtOneAM(@Body() data: { keySecret: string }) {
    if (!data.keySecret) return null;
    else {
      if (data.keySecret !== process.env.KEY_SECRET) return null;
    }
    return await this.service.autoRunAtOneAM();
  }

  @Post('every-7-am')
  public async autoRunAt7AM(@Body() data: { keySecret: string }) {
    if (!data.keySecret) return null;
    else {
      if (data.keySecret !== process.env.KEY_SECRET) return null;
    }
    return await this.service.autoRunAt7AM();
  }

  @Post('every-hour')
  public async autoRunEveryHour(@Body() data: { keySecret: string }) {
    if (!data.keySecret) return null;
    else {
      if (data.keySecret !== process.env.KEY_SECRET) return null;
    }
    return await this.service.autoRunEveryHour();
  }
}
