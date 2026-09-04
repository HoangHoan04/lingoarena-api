import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import {
  AiTutorPersonaRepo,
  ConversationMessageRepo,
  ConversationParticipantRepo,
  ConversationRepo,
} from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { ConversationService } from './conversation.service';

@ChildModule({
  providers: [ConversationService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([
      AiTutorPersonaRepo,
      ConversationRepo,
      ConversationParticipantRepo,
      ConversationMessageRepo,
    ]),
    ActionLogModule,
  ],
  exports: [ConversationService],
})
export class ConversationModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
