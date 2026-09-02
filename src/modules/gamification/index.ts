import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { UserGamificationStatRepo, AchievementRepo, UserAchievementRepo, PointLedgerEntryRepo, DailyChallengeRepo, UserDailyChallengeProgressRepo, UserDailyActivityRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { GamificationService } from './service';

@ChildModule({
  providers: [GamificationService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([UserGamificationStatRepo, AchievementRepo, UserAchievementRepo, PointLedgerEntryRepo, DailyChallengeRepo, UserDailyChallengeProgressRepo, UserDailyActivityRepo]),
    ActionLogModule,
  ],
  exports: [GamificationService],
})
export class GamificationModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
