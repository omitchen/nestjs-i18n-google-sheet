import { google } from 'googleapis';
import type { drive_v2 as driveV2, sheets_v4 as sheetV4 } from 'googleapis';
import { JWT } from 'google-auth-library';
import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { I18nModuleOptions } from './interfaces/i18n-module-options.interface';
import { I18N_MODULE_OPTIONS } from './utils/constants';

const logger = new Logger('GoogleSheetService');

export type GoogleSheetIssuer = string;

@Injectable()
export class GoogleSheetService {
  sheetClient: sheetV4.Sheets;
  driveClient: driveV2.Drive;
  private googleAuth: JWT;
  private spreadSheetIds: Record<string, string>;

  constructor(@Inject(I18N_MODULE_OPTIONS) private readonly options: I18nModuleOptions) {
    const { credentials, spreadSheetIds } = options;

    if (!credentials || !spreadSheetIds) {
      throw new Error('Google Sheet configurations not complete');
    }

    this.spreadSheetIds = spreadSheetIds;

    const serviceAccountAuth = new JWT({
      key: credentials.private_key,
      email: credentials.client_email,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    this.googleAuth = serviceAccountAuth;

    google.options({
      http2: false,
      retry: true,
      timeout: 5 * 1000,
      retryConfig: {
        retry: 3,
        onRetryAttempt: (err) => {
          const { config, ...error } = err;
          logger.warn({
            message: `${((config as any)?.retryConfig?.currentRetryAttempt || 0) + 1}th attempt failed.`,
            error,
          });
        },
        retryBackoff: (_, defaultMs) => {
          logger.warn({ message: `retry backoff ${defaultMs}ms` });
          return new Promise(resolve => setTimeout(resolve, defaultMs));
        },
      },
    });

    this.sheetClient = google.sheets({
      version: 'v4',
      auth: serviceAccountAuth,
    });

    this.driveClient = google.drive({
      version: 'v2',
      auth: serviceAccountAuth,
    });
  }

  private getSpreadsheetId(issuer: GoogleSheetIssuer): string {
    const id = this.spreadSheetIds[issuer];
    if (!id) {
      throw new Error(`Spreadsheet ID not found for issuer: ${issuer}`);
    }
    return id;
  }

  public async getCellsBySheetName(
    issuer: GoogleSheetIssuer,
    sheetName: string,
  ): Promise<string[][]> {
    logger.log({ message: 'fetch Google Sheet', issuer, sheetName });
    const spreadsheetId = this.getSpreadsheetId(issuer);
    const { data } = await this.sheetClient.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!C2:T`,
    });
    return (data.values as string[][] | undefined) || [];
  }

  public async getCellsAll(issuer: GoogleSheetIssuer): Promise<string[][]> {
    logger.log({ message: 'fetch Google Sheet all sheets', issuer });
    const spreadsheetId = this.getSpreadsheetId(issuer);

    const { data: sheetsData } = await this.sheetClient.spreadsheets.get({
      spreadsheetId,
      includeGridData: false,
      fields: 'sheets.properties.title',
    });
    const sheetTitles = sheetsData.sheets?.map(sheet => sheet.properties?.title).filter(Boolean) as string[] || [];

    const res: string[][] = [];
    const batchSize = 5;
    for (let i = 0; i < sheetTitles.length; i += batchSize) {
      const batchTitles = sheetTitles.slice(i, i + batchSize);
      const ranges = batchTitles.map(sheetTitle => `'${sheetTitle}'!C2:T`);
      logger.log({ message: 'sheet batch fetch', titles: batchTitles });

      try {
        const { data: cellsData } = await this.sheetClient.spreadsheets.values.batchGet({
          spreadsheetId,
          ranges: ranges,
          fields: 'valueRanges.values',
        });

        if (cellsData.valueRanges) {
           cellsData.valueRanges.forEach(vr => {
              if (vr.values && vr.values.length > 0) {
                 res.push(...(vr.values as string[][]));
              }
           });
        }
      } catch (error) {
         logger.error({ message: 'Error fetching sheet batch', titles: batchTitles, error });
      }
    }

    logger.log({ message: 'sheet batch fetch done', totalSheets: sheetTitles.length, totalRowsFetched: res.length });
    return res;
  }


  public async getEtag(issuer: GoogleSheetIssuer): Promise<string> {
    const spreadsheetId = this.getSpreadsheetId(issuer);
    try {
      const { headers } = await this.driveClient.files.get({
        fileId: spreadsheetId,
        fields: 'etag',
      });
       const etag = headers?.etag || '';
       logger.log({ message: 'get google sheet etag', issuer, etag });
       return etag;
    } catch (error) {
       logger.error({ message: 'Error fetching etag', issuer, error });
       throw new Error(`Failed to fetch etag for issuer ${issuer}: ${error.message}`);
    }
  }

  public getAvailableIssuers(): string[] {
    return Object.keys(this.spreadSheetIds);
  }
}