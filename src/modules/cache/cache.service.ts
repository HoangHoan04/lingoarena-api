import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async setCacheKey(key: string, value: string): Promise<void> {
    await this.cacheManager.set(key, value);
  }

  async getCacheKey(key: string): Promise<string | undefined | null> {
    return await this.cacheManager.get<string>(key);
  }

  async deleteCacheKey(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Xóa toàn bộ Cache
   * Dùng .clear() (hoặc reset() trên store nếu có)
   */
  async resetCache(): Promise<void> {
    const store = this.cacheManager.stores[0] as any;
    if (typeof store?.clear === 'function') {
      await store.clear();
    } else if (typeof store?.reset === 'function') {
      await store.reset();
    }
  }

  /**
   * Lấy danh sách tất cả các key từ store đầu tiên
   */
  async cacheStore(): Promise<string[]> {
    const store = this.cacheManager.stores[0] as any;
    if (typeof store?.keys === 'function') {
      return await store.keys();
    }
    return [];
  }

  /**
   * Lấy danh sách key theo prefix
   */
  async getByPrefix(prefix: string): Promise<string[]> {
    const store = this.cacheManager.stores[0] as any;
    if (typeof store?.keys === 'function') {
      return await store.keys(`${prefix}*`);
    }
    return [];
  }

  /**
   * Xóa tất cả cache bắt đầu bằng prefix DB_PRIMARY_DATABASE
   */
  async clearByPrefix(): Promise<void> {
    const prefix = process.env.DB_PRIMARY_DATABASE || '';
    const keys = await this.getByPrefix(prefix);

    if (keys.length > 0) {
      await Promise.all(keys.map(key => this.cacheManager.del(key)));
    }
  }

  /**
   * Xóa cache liên quan đến một controller cụ thể
   */
  async clearByControllerName(controllerName: string): Promise<{ isSuccess: boolean }> {
    const prefix = process.env.DB_PRIMARY_DATABASE || '';
    const keys = await this.getByPrefix(prefix);

    const controllerKeys = keys.filter(key => key.includes(`/${controllerName}`));

    if (controllerKeys.length > 0) {
      await Promise.all(controllerKeys.map(key => this.cacheManager.del(key)));
    }

    return { isSuccess: true };
  }
}
