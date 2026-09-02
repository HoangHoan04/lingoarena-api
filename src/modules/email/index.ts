import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { EmailQueueService } from './email-queue.service';
import { EmailService } from './email.service';

@ChildModule({
  providers: [EmailService, EmailQueueService],
  exports: [EmailService],
})
export class EmailModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
