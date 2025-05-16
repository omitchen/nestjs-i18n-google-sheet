import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CacheAdapter } from '../interfaces/cache-adapter.interface';

@Injectable()
export class RedisCacheAdapter implements CacheAdapter {
  constructor(readonly redisClient: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.set(key, value, 'EX', ttl);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async setNX(key: string, value: any, ttl?: number): Promise<boolean> {
    if (ttl) {
      return (await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl, 'NX')) === 'OK';
    }
    return (await this.redisClient.setnx(key, JSON.stringify(value))) === 1;
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.redisClient.expire(key, ttl);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
} 