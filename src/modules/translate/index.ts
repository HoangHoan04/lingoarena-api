import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TranslateService } from './service/translate.service';

@Module({
  imports: [HttpModule.register({ timeout: 20000, maxRedirects: 3 })],
  providers: [TranslateService],
  exports: [TranslateService],
})
export class TranslateModule {}
