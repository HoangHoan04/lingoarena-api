import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import {
  GrammarExampleRepo,
  GrammarStructureRepo,
  GrammarTopicRepo,
  UserGrammarMasteryRepo,
} from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { GrammarService } from './service';

@ChildModule({
  providers: [GrammarService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([
      GrammarTopicRepo,
      GrammarStructureRepo,
      GrammarExampleRepo,
      UserGrammarMasteryRepo,
    ]),
    ActionLogModule,
  ],
  exports: [GrammarService],
})
export class GrammarModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
