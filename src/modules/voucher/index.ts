import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { VoucherService } from './voucher.service';

@ChildModule({
  providers: [VoucherService],
  controllers: [],
  imports: [TypeOrmExModule.forCustomRepository([]), ActionLogModule],
  exports: [VoucherService],
})
export class VoucherModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
