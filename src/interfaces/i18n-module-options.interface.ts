import { ModuleMetadata } from '@nestjs/common';
import { Redis } from 'ioredis';

export interface I18nModuleOptions {
  credentials: {
    private_key: string;
    client_email: string;
  };
  spreadSheetIds: Record<string, string>;
  supportedLanguages?: string[];
  useRedis?: boolean;
  redis?: Redis;
}

export interface I18nModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory: (...args: any[]) => Promise<I18nModuleOptions> | I18nModuleOptions;
}

export type Messages = Record<string, Record<string, string>>; // langTag -> (key -> value)