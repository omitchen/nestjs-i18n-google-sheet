# NestJS I18n Google Sheet

A NestJS module for internationalization (i18n) using Google Sheets as the source for translation data.

## Features

- Fetch translation data directly from Google Sheets
- Support for multiple spreadsheets with different issuers
- Distributed caching mechanism ensures high performance and scalability
- Easy integration with NestJS applications

## Installation

```bash
npm install nestjs-i18n-google-sheet
```

## Usage

```typescript
import { I18nModule } from 'nestjs-i18n-google-sheet';

I18nModule.forRootAsync({
  imports: [ConfigModule, SharedModule],
  inject: [ConfigService, RedisService],
  useFactory: (
    configService: ConfigService,
    redisService: RedisService,
  ) => ({
    credentials: {
      private_key:
        configService.get<string>('googleSheet.credentials.private_key')
        || '',
      client_email:
        configService.get<string>('googleSheet.credentials.client_email')
        || '',
    },
    spreadSheetIds: {
      ...configService.get<Record<string, string>>(
        'googleSheet.spreadSheetIds',
      ),
    },
    supportedLanguages: ['ja','ko','id','vi','th','zh-Hant','it','fr','de','tr','ar','pt','es','ru','hi'],
    useRedis: true,
    redis: redisService.client,
  }),
}), 
```

## Configuration

```typescript
{
  credentials: {
    private_key: string;
    client_email: string;
  };
  spreadSheetIds: Record<string, string>;
  supportedLanguages?: string[];
  useRedis?: boolean;
  redis?: Redis;
}
```

## Google Sheet Template Example

[Google Sheet Template Example](https://docs.google.com/spreadsheets/d/1bsbDPWfYWyfp6UOfG3hXMQSOtkygEZa2_J2ewO2vuBo/edit?gid=0#gid=0)




