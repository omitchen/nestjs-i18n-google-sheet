import { Controller, Get, Query, UsePipes, Version, BadRequestException } from '@nestjs/common'; // Import BadRequestException
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiTags } from '@nestjs/swagger';
import { I18nService } from './i18n.service';
import { MessagesQuery } from './i18n.interface'; // Import Zod DTO
// import { GoogleSheetIssuer } from './googlesheet.service'; // Not needed
import { GoogleSheetService } from './googlesheet-v2.service'; // Import v2 Service

@ApiTags('i18n')
@Controller({
  path: 'i18n',
  version: '1',
})
@UsePipes(ZodValidationPipe) // Use ZodValidationPipe for initial validation
export class I18nController {
  constructor(
    private readonly i18nService: I18nService,
    private readonly googleSheetService: GoogleSheetService, // Inject GoogleSheetService to validate issuer
  ) {}

  // V1 version handling
  @Get('messages')
  async getMessages(@Query() query: MessagesQuery) { // Use async
    const { issuer, sheetName, langs, revalidate } = query;

    // Dynamically validate if the issuer is valid
    const availableIssuers = this.googleSheetService.getAvailableIssuers();
    if (!availableIssuers.includes(issuer)) {
        throw new BadRequestException(`Invalid issuer: ${issuer}. Available issuers are: ${availableIssuers.join(', ')}`);
    }

    console.log('getMessages V1', issuer, sheetName, langs, revalidate);
    // Call the service to get data, the revalidate parameter may need to be adjusted or removed, V2 uses a more advanced refresh logic
    // If V1 only needs simple caching, revalidate can be used to force refresh, but does not trigger MQ
    // Based on the previous analysis, V1 version may use the old logic based on google-spreadsheet or simple caching logic
    // Here, it is assumed that V1 still uses i18nService.getMessages and simply processes revalidate
    return await this.i18nService.getMessages({ issuer, sheetName, langs }, revalidate);
  }

  // V2 version handling
  @Get('messages')
  @Version('2')
  async getMessagesV2(@Query() query: MessagesQuery) {
    const { issuer, sheetName, langs, revalidate } = query;
    const availableIssuers = this.googleSheetService.getAvailableIssuers();
    if (!availableIssuers.includes(issuer)) {
        throw new BadRequestException(`Invalid issuer: ${issuer}. Available issuers are: ${availableIssuers.join(', ')}`);
    }

    console.log('getMessages V2', issuer, sheetName, langs, revalidate);
    return await this.i18nService.getMessagesV2({ issuer, sheetName, langs }, revalidate);
  }
}