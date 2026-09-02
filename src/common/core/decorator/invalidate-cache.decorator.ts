import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { DEF_INVALIDATE_CACHE_KEY } from '~/common/constants';
import { CacheInvalidateInterceptor } from '~/common/systems/interceptors';

export const DefInvalidateCache = (controllers: string[] = []) =>
  applyDecorators(
    SetMetadata(DEF_INVALIDATE_CACHE_KEY, controllers),
    UseInterceptors(CacheInvalidateInterceptor),
  );
