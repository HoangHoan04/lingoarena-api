import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard } from '~/common/guards';
import { UserDto } from '~/dto';
import { ChallengeProgressDto, PracticePointsDto } from '../dto';
import { GamificationService } from '../service/gamification.service';

@ApiBearerAuth()
@ApiTags('User - Gamification')
@UseGuards(JwtAuthGuard)
@DefController('gamification')
export class UserGamificationController {
  constructor(private readonly service: GamificationService) {}

  @DefGet('me/stats')
  @ApiOperation({ summary: 'Thống kê điểm thưởng của tôi' })
  getMyStats(@CurrentUser() user: UserDto) {
    return this.service.getMyStats(user);
  }

  @DefGet('challenges/today')
  @ApiOperation({ summary: 'Thử thách hôm nay' })
  getTodayChallenges(@CurrentUser() user: UserDto) {
    return this.service.getTodayChallenges(user);
  }

  @DefPost('challenges/:code/progress')
  @ApiOperation({ summary: 'Cập nhật tiến độ thử thách' })
  progressChallenge(@Param('code') code: string, @Body() dto: ChallengeProgressDto, @CurrentUser() user: UserDto) {
    return this.service.progressChallenge(code, dto, user);
  }

  @DefPost('me/practice-points')
  @ApiOperation({ summary: 'Nhận điểm luyện tập trong ngày' })
  awardPracticePoints(@Body() dto: PracticePointsDto, @CurrentUser() user: UserDto) {
    return this.service.awardPracticePoints(dto, user);
  }
}
