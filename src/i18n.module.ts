// src/i18n.module.ts
import { DynamicModule, Logger, Module, Provider } from "@nestjs/common";
import { I18nController } from "./i18n.controller";
import { I18nService } from "./i18n.service";
import { GoogleSheetService } from "./googlesheet-v2.service";
import {
  I18nModuleAsyncOptions,
} from "./interfaces/i18n-module-options.interface";
import { I18N_MODULE_OPTIONS } from "./utils/constants";
import { createAdapterProviders } from "./providers/adapters.provider";

@Module({})
export class I18nModule {
  static forRootAsync(options: I18nModuleAsyncOptions): DynamicModule {
    const imports = [...(options.imports || [])];

    const providers: Provider[] = [
      {
        provide: I18N_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      GoogleSheetService,
      ...createAdapterProviders,
      I18nService,
      Logger,
    ];

    return {
      module: I18nModule,
      imports: imports,
      controllers: [I18nController],
      providers: providers,
      exports: [I18nService],
    };
  }
}
