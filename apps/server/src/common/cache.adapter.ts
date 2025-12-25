/**
 * Redis 缓存适配器
 * 
 * 生产环境使用 Redis 替代内存缓存
 */

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * 内存缓存 (开发环境)
 */
export class MemoryCacheAdapter implements CacheAdapter {
  private cache = new Map<string, { value: any; expireAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set(key: string, value: any, ttl: number = 60000): Promise<void> {
    this.cache.set(key, {
      value,
      expireAt: Date.now() + ttl,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * Redis 缓存 (生产环境)
 * 
 * TODO: 集成 ioredis
 */
export class RedisCacheAdapter implements CacheAdapter {
  async get<T>(key: string): Promise<T | null> {
    // TODO: 实现 Redis GET
    return null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    // TODO: 实现 Redis SETEX
  }

  async del(key: string): Promise<void> {
    // TODO: 实现 Redis DEL
  }

  async clear(): Promise<void> {
    // TODO: 实现 Redis FLUSHDB
  }
}

/**
 * 缓存工厂
 */
export function createCacheAdapter(): CacheAdapter {
  // 根据环境变量选择适配器
  const useRedis = process.env.USE_REDIS === 'true';
  return useRedis ? new RedisCacheAdapter() : new MemoryCacheAdapter();
}
