import { UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { UserDto } from '~/dto';
import { LeaderboardService } from '../service/leaderboard.service';

@ApiBearerAuth()
@ApiTags('Admin - Leaderboard')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('leaderboard')
export class AdminLeaderboardController {
  constructor(private readonly service: LeaderboardService) {}

  @DefPost('snapshots/rebuild')
  @ApiOperation({ summary: 'Tạo snapshot bảng xếp hạng từ điểm hiện tại' })
  rebuild(@CurrentUser() user: UserDto) {
    return this.service.rebuildSnapshots(user);
  }
}
