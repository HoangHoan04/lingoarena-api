import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { from, of } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { DEF_CACHE_KEY } from '~/common/constants';
import { DefCacheOptions } from '~/common/core/decorator';
import { coreHelper } from '~/common/core/helpers';

require('dotenv').config();

function isPromiseLike(v: any): v is Promise<any> {
  return v && typeof v.then === 'function';
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request>();

    const url = request.url;
    const method = request.method;
    const body = request.body;
    const language = request.headers['x-lang'] || '';
    const width = request.headers['x-screen-width'] || '';
    const height = request.headers['x-screen-height'] || '';

    const isMobile = coreHelper.isMobileScreen(width, height);

    const maxLengthKey = 10000;

    const key = `${process.env.DB_PRIMARY_DATABASE}:${url}:${method}:${language}:${isMobile}:${body ? JSON.stringify(body) : ''}`;
    if (key.length <= maxLengthKey) {
      const checkKey: any = await this.cacheManager.get(key);

      if (checkKey) {
        return of(checkKey);
      }
    }

    request.headers['keyCache'] = key;

    return next.handle().pipe(
      mergeMap(v => (isPromiseLike(v) ? from(v) : of(v))),
      tap(async res => {
        const options = this.reflector.get<DefCacheOptions>(DEF_CACHE_KEY, context.getHandler());
        const ttl = +options?.ttl || 0;
        try {
          const key = request.headers['keyCache'] as string;
          if (key.length <= maxLengthKey) {
            await this.cacheManager.set(key, res, ttl);
          }
        } catch (error: any) {
          console.error('Error set cache:', error?.message);
        }
      }),
    );
  }
}
