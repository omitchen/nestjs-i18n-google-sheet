import Redis from "ioredis";

export interface CacheAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  setNX(key: string, value: any, ttl?: number): Promise<boolean>;
  expire(key: string, ttl: number): Promise<void>;
  del(key: string): Promise<void>;
  redisClient?: Redis;
} 