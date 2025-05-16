import { Inject, Injectable, Logger } from '@nestjs/common';
import Redlock from 'redlock';
import { GoogleSheetIssuer, GoogleSheetService } from './googlesheet-v2.service';
import { CacheAdapter } from './interfaces/cache-adapter.interface';
import {
  CACHE_ADAPTER,
  I18N_MODULE_OPTIONS
} from './utils/constants';
import { I18nModuleOptions, Messages } from './interfaces/i18n-module-options.interface';

interface GetMessagesOptions {
  issuer: GoogleSheetIssuer;
  sheetName: string;
  langs?: string[];
}


@Injectable()
export class I18nService {
  private readonly redlock?: Redlock;
  constructor(
    @Inject(CACHE_ADAPTER) private readonly cache: CacheAdapter,
    private readonly googleSheetService: GoogleSheetService, // GoogleSheetService is now managed by DI
    private readonly logger: Logger,
    @Inject(I18N_MODULE_OPTIONS) private readonly options: I18nModuleOptions, // Injecting configuration options
  ) {
    if(this.options.useRedis && this.cache.redisClient) {
      this.redlock = new Redlock([this.cache.redisClient]);
    }
  }

  public async getMessages(
    { sheetName, issuer, langs }: GetMessagesOptions,
    updateCache = false,
  ) {
    const cacheKey = `i18n:${issuer}:${sheetName}`;
    const cached = await this.cache.get(cacheKey);
    if (cached && !updateCache) {
      this.logger.log({ message: `i18n cache hit for ${cacheKey}` });
      return this.filterMessages(JSON.parse(cached), langs);
    }
    // https://developers.google.com/sheets/api/limits?hl=zh-cn#exponential https://www.npmjs.com/package/exponential-backoff
    const messages = await (sheetName !== 'all'
      ? this.googleSheetService.getCellsBySheetName(issuer, sheetName)
      : this.googleSheetService.getCellsAll(issuer));
    const jsonMsg = this.serializeMessages(messages);
    await this.cache.set(cacheKey, JSON.stringify(jsonMsg));
    this.logger.log({ message: `i18n cache revalidated for ${cacheKey}` });
    return this.filterMessages(jsonMsg, langs);
  }

  async revalidate({ sheetName, issuer, langs }: GetMessagesOptions) {
    const etag = await this.googleSheetService.getEtag(issuer);
    const cachedEtag = await this.cache.get(`i18n:${issuer}:etag`);
    if (etag === cachedEtag) {
      this.logger.log({ message: `i18n cache validated for ${issuer}` });
    } else {
      this.logger.log({ message: `cache revalidation required for ${issuer}` });
      await this.getFreshMessages({ issuer, sheetName, langs, etag });
      await this.cache.expire(`i18n:${issuer}:revalidating`, 0);
      this.logger.log({ message: `i18n cache revalidated for ${issuer}` });
    }
  }

  private async getFreshMessages(msg: GetMessagesOptions & { etag?: string }) {
    const { issuer, sheetName, langs } = msg;
    const etag = msg.etag || (await this.googleSheetService.getEtag(issuer));

    // If using Redis, distributed lock is needed to handle concurrency
    if (this.redlock) {
      const lockKey = `locks:i18n:${issuer}:${sheetName}`;
      const lock = await this.redlock.acquire([lockKey], 60 * 1000, {
        retryDelay: 10 * 1000,
      });

      try {
        const cachedEtagAfterLock = await this.cache.get(`i18n:${issuer}:etag`);
        if (etag === cachedEtagAfterLock) {
          this.logger.log({ message: 'cache revalidated after lock' });
          return this.getMessages({ sheetName, issuer, langs });
        }

        const messages = await this.getMessages({ sheetName, issuer, langs }, true);
        await this.cache.set(`i18n:${issuer}:etag`, etag);
        return messages;
      } finally {
        await lock.release();
      }
    }

    // When using memory cache, just update it directly
    const messages = await this.getMessages({ sheetName, issuer, langs }, true);
    await this.cache.set(`i18n:${issuer}:etag`, etag);
    return messages;
  }

  public async getMessagesV2(
    { sheetName, issuer, langs }: GetMessagesOptions,
    refresh = false,
  ) {
    const cacheKey = `i18n:${issuer}:${sheetName}`;
    const cached = await this.cache.get(cacheKey);
    if (cached && !refresh) {
      this.logger.log({ message: `i18n cache hit for ${cacheKey}` });
      const notRevalidating = await this.cache.setNX(
        `i18n:${issuer}:revalidating`,
        Date.now(),
        60,
      );
      if (notRevalidating) {
        this.revalidate({ sheetName, issuer, langs })
        .catch(err => this.logger.error('Cache revalidation failed:', err));
      }
      return this.filterMessages(JSON.parse(cached), langs);
    } else {
      return await this.getFreshMessages({ sheetName, issuer, langs });
    }
  }

  private filterMessages(messages: Messages, langs?: string[]) {
    if (!langs) {
      return messages;
    }
    return {
      en: messages.en,
      ...Object.fromEntries(
        langs.map(langTag => [langTag, messages[langTag]]),
      ),
    };
  }

  private serializeMessages(messages: Array<string[]>) {
    const res: Map<string, Map<string, string>> = new Map(
      ['en', ...this.options.supportedLanguages].map(lang => [lang, new Map()]),
    );
    messages.forEach((message) => {
      if (message?.[0]) {
        const [key, en, _, ...langs] = message;
        const allLocales = [en, ...langs];
        ['en', ...this.options.supportedLanguages].forEach((lang, index) => {
          allLocales[index] && res.get(lang)!.set(key, allLocales[index]);
        });
      }
    });
    return [...res.entries()].reduce((acc, [key, value]) => {
      acc[key] = Object.fromEntries(value);
      return acc;
    }, {} as Messages);
  }
}