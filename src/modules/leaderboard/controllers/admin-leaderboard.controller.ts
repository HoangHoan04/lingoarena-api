import { UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefController } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { LeaderboardService } from '../service/leaderboard.service';

@ApiBearerAuth()
@ApiTags('Admin - Leaderboard')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('leaderboard')
export class AdminLeaderboardController {
  constructor(private readonly service: LeaderboardService) {}
}
