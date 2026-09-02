import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { from, of } from 'rxjs';
import { concatMap, mergeMap } from 'rxjs/operators';
import { DEF_INVALIDATE_CACHE_KEY } from '~/common/constants';

function isPromiseLike(v: any): v is Promise<any> {
  return v && typeof v.then === 'function';
}

@Injectable()
export class CacheInvalidateInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const controllers =
      this.reflector.getAllAndOverride<string[]>(DEF_INVALIDATE_CACHE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (!controllers.length) {
      return next.handle();
    }

    const uniqueControllers = [...new Set(controllers.filter(Boolean))];

    return next.handle().pipe(
      mergeMap(v => (isPromiseLike(v) ? from(v) : of(v))),

      concatMap(async responseData => {
        try {
          const store = this.cacheManager.stores[0] as any;
          if (typeof store?.keys === 'function') {
            const dbPrefix = process.env.DB_PRIMARY_DATABASE || '';
            const keys: string[] = await store.keys(`${dbPrefix}*`);

            const controllerKeys = keys.filter(key =>
              uniqueControllers.some(controllerName => key.includes(`/${controllerName}`)),
            );

            if (controllerKeys.length > 0) {
              await Promise.all(controllerKeys.map(key => this.cacheManager.del(key)));
            }
          }
        } catch (error: any) {
          console.error(
            '[CacheInvalidateInterceptor] Error clearing cache:',
            error?.message || error,
          );
        }

        return responseData;
      }),
    );
  }
}
