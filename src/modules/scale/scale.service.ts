import { Injectable } from '@nestjs/common';

@Injectable()
export class ScaleService {
  constructor() {}

  /** mỗi phút */
  public autoRunEveryMinute() {
    return true;
  }
  /** Hàm chạy giữa đêm */
  public async autoRunMidNight() {
    return true;
  }

  /** Hàm chạy 10 phút */
  public async autoRunEvery10Minutes() {
    return true;
  }

  /** Hàm chạy cuối tháng */
  public async autoRunEveryEndOfMonth() {
    return true;
  }

  public async autoRunEveryYear() {}
  /** Hàm chạy 1 giờ sáng */
  public async autoRunAtOneAM() {
    return true;
  }

  /** Hàm chạy 23 giờ mỗi ngày */
  public async autoRun23hEveryDay() {
    return true;
  }

  /** Hàm chạy 7 sáng mỗi ngày */
  public async autoRunAt7AM() {
    return true;
  }

  /** Hàm chạy mỗi giờ */
  public async autoRunEveryHour() {
    return true;
  }
}
