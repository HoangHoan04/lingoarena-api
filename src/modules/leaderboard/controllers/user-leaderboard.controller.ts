import { Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DefController, DefGet } from '~/common/core/decorator';
import { JwtOptionalGuard } from '~/common/guards';
import { LeaderboardService } from '../service/leaderboard.service';

@ApiTags('User - Leaderboard')
@DefController('leaderboard')
export class UserLeaderboardController {
  constructor(private readonly service: LeaderboardService) {}

  @UseGuards(JwtOptionalGuard)
  @DefGet('snapshots')
  @ApiOperation({ summary: 'Bảng xếp hạng snapshot hoặc live' })
  getSnapshots(@Query('boardType') boardType?: string, @Query('period') period?: string) {
    return this.service.getSnapshots(boardType, period);
  }
}
