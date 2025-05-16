import { Injectable } from '@nestjs/common';
import { CacheAdapter } from '../interfaces/cache-adapter.interface';

@Injectable()
export class InMemoryCacheAdapter implements CacheAdapter {
  private cache = new Map<string, { value: string; expiry?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiry: ttl ? Date.now() + ttl * 1000 : undefined,
    });
  }

  async setNX(key: string, value: any, ttl?: number): Promise<boolean> {
    if (this.cache.has(key)) return false;
    
    await this.set(key, JSON.stringify(value), ttl);
    return true;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const item = this.cache.get(key);
    if (item) {
      item.expiry = Date.now() + ttl * 1000;
      this.cache.set(key, item);
    }
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
} 