import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { MediaAssetRepo, MediaAttachmentRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { MediaService } from './service';

@ChildModule({
  providers: [MediaService],
  controllers: [],
  imports: [TypeOrmExModule.forCustomRepository([MediaAssetRepo, MediaAttachmentRepo]), ActionLogModule],
  exports: [MediaService],
})
export class MediaModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
