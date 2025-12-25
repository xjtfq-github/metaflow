import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  max?: number; // Maximum number of items
}

/**
 * 通用缓存服务
 * 
 * 功能:
 * 1. LRU (Least Recently Used) 缓存策略
 * 2. 支持 TTL (Time To Live)
 * 3. 用于元数据和查询结果缓存
 */
@Injectable()
export class CacheService {
  private cache: LRUCache<string, any, unknown>;

  constructor() {
    this.cache = new LRUCache({
      max: 500, // 最多缓存 500 项
      ttl: 1000 * 60 * 5, // 默认 5 分钟过期
      allowStale: false,
      updateAgeOnGet: true,
      updateAgeOnHas: false,
    });
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    const opts = options?.ttl ? { ttl: options.ttl } : undefined;
    this.cache.set(key, value, opts);
  }

  /**
   * 检查是否存在
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      calculatedSize: this.cache.calculatedSize,
    };
  }

  /**
   * 生成缓存键
   */
  static generateKey(prefix: string, ...parts: (string | number)[]): string {
    return [prefix, ...parts].join(':');
  }
}
