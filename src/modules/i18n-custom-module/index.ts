import { Global, Module } from '@nestjs/common';
import { I18nCustomService } from './i18n.service';

@Global()
@Module({
  providers: [I18nCustomService],
  exports: [I18nCustomService],
})
export class I18nCustomModule {}
