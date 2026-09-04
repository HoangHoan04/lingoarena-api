import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { GrammarStructureRepo, GrammarTopicRepo, UserMasteryRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { GrammarService } from './service';

@ChildModule({
  providers: [GrammarService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([GrammarTopicRepo, GrammarStructureRepo, UserMasteryRepo]),
    ActionLogModule,
  ],
  exports: [GrammarService],
})
export class GrammarModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
