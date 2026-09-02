import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ChildModule } from '~/common/core/decorator';
import { PREFIX_MODULE } from '../config-module';
import { UploadFileController } from './upload-file.controller';
import { UploadFileService } from './upload-file.service';

@ChildModule({
  prefix: PREFIX_MODULE.upload,
  controllers: [UploadFileController],
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  providers: [UploadFileService],
  exports: [UploadFileService],
})
export class UploadFileModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
