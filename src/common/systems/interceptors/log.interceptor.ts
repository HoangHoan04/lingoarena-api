import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

const SLOW_REQ_MS = 10000;
const STALL_WARN_MS = 500;
const CHECK_INTERVAL_MS = 20;

@Injectable()
export class LogInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    const route = `${req.method} ${req.originalUrl || req.url}`;

    const t0 = process.hrtime.bigint();

    let maxLagMs = 0;
    let expected = Date.now() + CHECK_INTERVAL_MS;
    const itv = setInterval(() => {
      const now = Date.now();
      const lag = now - expected;
      if (lag > maxLagMs) maxLagMs = lag;
      expected = now + CHECK_INTERVAL_MS;
    }, CHECK_INTERVAL_MS);
    itv.unref?.();

    return next.handle().pipe(
      tap(() => {
        clearInterval(itv);

        const t1 = process.hrtime.bigint();
        const durMs = Number(t1 - t0) / 1e6;

        if (durMs >= SLOW_REQ_MS || maxLagMs >= STALL_WARN_MS) {
          console.warn(
            '[HOTPATH]',
            `route="${route}"`,
            `status=${res.statusCode}`,
            `dur=${durMs.toFixed(1)}ms`,
            `stall_max=${Math.max(0, Math.round(maxLagMs))}ms`,
          );
        }
      }),
    );
  }
}
