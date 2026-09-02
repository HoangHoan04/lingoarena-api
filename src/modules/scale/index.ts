import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PREFIX_MODULE } from '../config-module';

import { ChildModule } from '~/common/core/decorator';
import { ScaleController } from './scale.controller';
import { ScaleService } from './scale.service';

@ChildModule({
  prefix: PREFIX_MODULE.scale,
  providers: [ScaleService],
  controllers: [ScaleController],
  imports: [],
  exports: [],
})
export class ScaleModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
