import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { LeaderboardSnapshotRepo, UserGamificationStatRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { LeaderboardService } from './service';

@ChildModule({
  providers: [LeaderboardService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([LeaderboardSnapshotRepo, UserGamificationStatRepo]),
    ActionLogModule,
  ],
  exports: [LeaderboardService],
})
export class LeaderboardModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
