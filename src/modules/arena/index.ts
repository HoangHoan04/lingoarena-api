import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import {
  ArenaChallengeRepo,
  ArenaMatchAnswerRepo,
  ArenaMatchParticipantRepo,
  ArenaMatchQuestionRepo,
  ArenaMatchRepo,
  ArenaQueueTicketRepo,
  ArenaRatingRepo,
  QuestionOptionRepo,
  QuestionRepo,
  UserRepo,
} from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { GamificationModule } from '../gamification';
import { ArenaService } from './service';

@ChildModule({
  providers: [ArenaService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([
      ArenaRatingRepo,
      ArenaMatchRepo,
      ArenaMatchQuestionRepo,
      ArenaMatchParticipantRepo,
      ArenaMatchAnswerRepo,
      ArenaQueueTicketRepo,
      ArenaChallengeRepo,
  QuestionRepo,
  QuestionOptionRepo,
      UserRepo,
    ]),
    ActionLogModule,
    GamificationModule,
  ],
  exports: [ArenaService],
})
export class ArenaModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
