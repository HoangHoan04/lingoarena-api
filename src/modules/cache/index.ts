import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { CacheService } from './cache.service';
import { HttpModule } from '@nestjs/axios';

@ChildModule({
  providers: [CacheService],
  exports: [CacheService],
  imports: [HttpModule],
})
export class CacheCustomModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
