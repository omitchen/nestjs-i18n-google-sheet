import { Provider } from '@nestjs/common';
import { InMemoryCacheAdapter } from '../adapters/in-memory-cache.adapter';
import { RedisCacheAdapter } from '../adapters/redis-cache.adapter';
import { I18nModuleOptions } from '../interfaces/i18n-module-options.interface';
import { CACHE_ADAPTER, I18N_MODULE_OPTIONS, REDIS_CLIENT } from '../utils/constants';

export const createAdapterProviders: Provider[] = [
  {
    provide: CACHE_ADAPTER,
    useFactory: (options: I18nModuleOptions) => {

      console.log('CACHE_ADAPTER Options:', {
        hasOptions: !!options,
        useRedis: options?.useRedis,
        hasRedisClient: !!options?.redis,
        redisClientType: options?.redis ? typeof options.redis : 'undefined'
      });

      if (options.useRedis && options.redis) {
        return new RedisCacheAdapter(options.redis);
      }
      return new InMemoryCacheAdapter();
    },
    inject: [
      I18N_MODULE_OPTIONS,
      { token: REDIS_CLIENT, optional: true },
    ],
  },
];