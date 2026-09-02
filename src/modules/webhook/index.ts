import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { PREFIX_MODULE } from '../config-module';

@ChildModule({
  prefix: PREFIX_MODULE.webhook,
  controllers: [],
  imports: [],
  exports: [],
})
export class WebhookModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
