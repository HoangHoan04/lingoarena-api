import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { ZaloService } from './zalo.service';

@ChildModule({
  providers: [ZaloService],
  controllers: [],
  imports: [TypeOrmExModule.forCustomRepository([]), HttpModule, ActionLogModule],
  exports: [ZaloService],
})
export class ZaloModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
