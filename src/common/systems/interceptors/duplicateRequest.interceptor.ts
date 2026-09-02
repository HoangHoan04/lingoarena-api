import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { finalize } from 'rxjs/operators';

require('dotenv').config();

@Injectable()
export class DuplicateRequestInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    const url = request.url;
    const method = request.method;
    const body = request.body;
    const user = request.user;

    if (!user?.id) {
      return next.handle();
    }

    const arrWhiteRoute = [
      'load',
      'pagination',
      'detail',
      'find',
      'report',
      'select-box',
      'get',
      '/list',
      '/by-',
    ];
    const isWhiteRoute = arrWhiteRoute.some(c => url.includes(c));

    if (method === 'GET' || isWhiteRoute) {
      return next.handle();
    }

    const rawKey = `${process.env.TYPEORM_DATABASE}:${url}:${method}:#${user?.id}:${body ? JSON.stringify(body) : ''}`;
    const hashKey = createHash('sha256').update(rawKey).digest('hex');
    const duplicateCacheKey = `duplicate:${hashKey}`;

    const checkKey: any = await this.cacheManager.get(duplicateCacheKey);
    if (checkKey) {
      console.log('duplicate: ', url);
      throw new ConflictException(
        'Yêu cầu đang được hệ thống xử lý, vui lòng không thao tác nhiều lần.',
      );
    }

    await this.cacheManager.set(duplicateCacheKey, '1', 5 * 60 * 1000);

    return next.handle().pipe(
      finalize(() => {
        this.cacheManager
          .del(duplicateCacheKey)
          .catch((error: any) =>
            console.error(
              `Error deleting duplicate cache key ${duplicateCacheKey}:`,
              error?.message,
            ),
          );
      }),
    );
  }
}
