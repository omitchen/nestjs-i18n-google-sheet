import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';

export type GoogleSheetIssuer = string;
const logger = new Logger('GoogleSheetService');

@Injectable()
export class GoogleSheetService {
  sheetMap = new Map<GoogleSheetIssuer, GoogleSpreadsheet>();
  
  constructor(@Inject('I18N_OPTIONS') private readonly options: any) {
    const { credentials, spreadSheetIds } = options;
    
    if (!credentials || !spreadSheetIds) {
      throw new Error('Google Sheet configurations not complete');
    }
    
    const serviceAccountAuth = new JWT({
      key: credentials.private_key,
      email: credentials.client_email,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });
    
    Object.keys(spreadSheetIds).forEach((key) => {
      this.sheetMap.set(
        key as GoogleSheetIssuer, 
        new GoogleSpreadsheet(spreadSheetIds[key], serviceAccountAuth)
      );
    });
  }

  public async getCellsBySheetName(issuer: GoogleSheetIssuer, sheetName: string) {
    logger.log({ message: 'fetch Google Sheet', issuer, sheetName });
    const doc = this.sheetMap.get(issuer);
    if (!doc) {
      throw new HttpException('Google Sheet not found', 404);
    }
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      throw new HttpException(`Sheet "${sheetName}" not found`, 404);
    }
    const res = await sheet.getCellsInRange('C2:T');
    return res;
  }

  public async getCellsAll(issuer: GoogleSheetIssuer) {
    logger.log({ message: 'fetch Google Sheet all sheets', issuer });
    const doc = this.sheetMap.get(issuer);
    if (!doc) {
      throw new HttpException('Google Sheet not found', 404);
    }
    await doc.loadInfo();
    const sheetCount = doc.sheetCount;
    const res: Array<string[]> = [];
    for (let i = 0; i < sheetCount; i++) {
      const sheet = doc.sheetsByIndex[i];
      const sheetRes = await sheet.getCellsInRange('C2:T');
      if (sheetRes?.length) {
        res.push(...sheetRes);
      }
    }
    return res;
  }
  
  public getAvailableIssuers(): string[] {
    return Array.from(this.sheetMap.keys());
  }
  
  public async getEtag(issuer: GoogleSheetIssuer): Promise<string> {
    const doc = this.sheetMap.get(issuer);
    if (!doc) {
      throw new HttpException('Google Sheet not found', 404);
    }
    
    await doc.loadInfo();
    const timestamp = Date.now().toString();
    logger.log({ message: 'get google sheet timestamp as etag', issuer, timestamp });
    return timestamp;
  }
}
