<p align="center">
<a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>
<h1 align="center">NestJS i18n Google Sheet 🌍</h1>

<p align="center">
  Streamline your NestJS application's internationalization with Google Sheets integration, enabling real-time collaborative translation management without deployment.
  <p align="center">
    <a href="https://www.npmjs.com/package/nestjs-i18n-google-sheet" target="_blank"><img alt="npm version" src="https://img.shields.io/npm/v/nestjs-i18n-google-sheet" /></a>
    <a href="https://www.npmjs.com/package/nestjs-i18n-google-sheet" target="_blank"><img alt="NPM" src="https://img.shields.io/npm/l/nestjs-i18n-google-sheet" /></a>
    <a href="https://www.npmjs.com/package/nestjs-i18n-google-sheet" target="_blank"><img alt="npm downloads" src="https://img.shields.io/npm/dm/nestjs-i18n-google-sheet" /></a>
  </p>
</p>

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Example](#example)
- [Configuration](#configuration)
- [Google Sheet Setup](#google-sheet-setup)
- [Contact and Feedback](#contact-and-feedback)
- [License](#license)

## Description

Simplify your translation workflow!

Traditional i18n solutions often require code changes and redeployment for translation updates. With nestjs-i18n-google-sheet, your translations live in Google Sheets, enabling:
- Real-time translation updates without deployment
- Collaborative translation management
- Non-technical team member participation
- Version control and change history
- Easy integration with existing translation workflows

## Installation

Install the package using npm:

```bash
npm install nestjs-i18n-google-sheet
```

## Example

Integrate nestjs-i18n-google-sheet into your NestJS application:

1. Import the module into your AppModule:

```typescript
import { I18nGoogleSheetModule } from 'nestjs-i18n-google-sheet';

@Module({
  imports: [
    I18nGoogleSheetModule.forRootAsync({
      googleSheetId: 'your-sheet-id',
      credentials: {
        // Your Google API credentials
      }
    }),
  ],
})
export class AppModule {}
```

2. Use the translation service in your controllers or services:

```typescript
import { I18nGoogleSheetService } from 'nestjs-i18n-google-sheet';

@Controller()
export class AppController {
  constructor(private readonly i18nService: I18nGoogleSheetService) {}

  @Get()
  async translate() {
    return this.i18nService.getMessagesV2({sheetName, issuer, langs}, refresh?);
  }
}
```

## Configuration

The module accepts the following configuration options:

```typescript
interface I18nGoogleSheetOptions {
  /**
   * Google API credentials
   */
  credentials: {
    private_key: string;
    client_email: string;
  };
  
  /**
   * Map of sheet names to their Google Sheet IDs
   * Example: { "main": "1abc...xyz", "marketing": "2def...uvw" }
   */
  spreadSheetIds: Record<string, string>;
  
  /**
   * List of supported language codes
   * Example: ["en", "zh", "ja", "ko"]
   * Optional
   */
  supportedLanguages?: string[];
  
  /**
   * Enable Redis caching
   * Optional, defaults to false
   */
  useRedis?: boolean;
  
  /**
   * Redis client instance
   * Required if useRedis is true
   */
  redis?: Redis;
}
```

Example configuration:

```typescript
import { I18nGoogleSheetModule } from 'nestjs-i18n-google-sheet';
import Redis from 'ioredis';

@Module({
  imports: [
    I18nGoogleSheetModule.forRootAsync({
      credentials: {
        private_key: process.env.GOOGLE_PRIVATE_KEY,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      spreadSheetIds: {
        main: process.env.MAIN_SHEET_ID,
        marketing: process.env.MARKETING_SHEET_ID,
      },
      supportedLanguages: ['en', 'zh', 'ja', 'ko'],
      useRedis: true,
      redis: new Redis({
        host: 'localhost',
        port: 6379,
      }),
    }),
  ],
})
export class AppModule {}
```

## Google Sheet Setup

1. Create a new Google Sheet (you can use [this template](https://docs.google.com/spreadsheets/d/1bsbDPWfYWyfp6UOfG3hXMQSOtkygEZa2_J2ewO2vuBo/edit?gid=0#gid=0) as a starting point)
2. Share it with your service account email
3. Get your spreadsheet ID from the URL:
   - Open your Google Sheet
   - The URL will look like: `https://docs.google.com/spreadsheets/d/1bsbDPWfYWyfp6UOfG3hXMQSOtkygEZa2_J2ewO2vuBo/edit#gid=0`
   - The spreadsheet ID is the long string between `/d/` and `/edit`: `1bsbDPWfYWyfp6UOfG3hXMQSOtkygEZa2_J2ewO2vuBo`
4. Format your sheet with the following columns:
   - Overview (section name)
   - Note (additional context)
   - Key (translation keys)
   - Source text (EN)
   - Comments (context for translators)
   - Language columns (JP, KR, ID, VI, TH, etc.)

Example sheet structure from the template:
| Overview | Note | Key | Source text (EN) | Comments | JP | KR | ID | VI |
|----------|------|-----|------------------|----------|----|----|----|----|
| Title | enhncr.title | AI Video Enhancer | Source text | Context | 日本語 | 한국어 | Bahasa | Tiếng Việt |

The template includes support for multiple languages and provides a structured format for managing translations efficiently.

## Contact and Feedback

Feel free to reach out if you have any questions or suggestions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
