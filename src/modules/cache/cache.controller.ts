import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CacheService } from './cache.service';

@Controller('/cache')
export class CacheController {
  constructor(private readonly service: CacheService) {}

  @Post()
  async setCacheKey(@Query('key') key: string, @Query('value') value: string) {
    return await this.service.setCacheKey(key, value);
  }

  @Get('/get/:key')
  async getCacheKey(@Param('key') key: string) {
    return await this.service.getCacheKey(key);
  }

  @Get('/get-by-prefix/:key')
  async getByPrefix(@Param('key') key: string) {
    return await this.service.getByPrefix(key);
  }

  @Delete('/:key')
  async deleteCacheKey(@Param('key') key: string) {
    await this.service.deleteCacheKey(key);
    return { message: 'Key deleted successfully' };
  }

  @Get('/clear-all')
  async clearAllCache() {
    await this.service.resetCache();
    return { message: 'Cache cleared successfully' };
  }

  @Get('/clear-cur-cache')
  async clearCurCache() {
    await this.service.clearByPrefix();
    return { message: 'Cache cleared successfully' };
  }

  @Get('/store')
  async cacheStore() {
    return await this.service.cacheStore();
  }
}
