import { Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { CreateArenaChallengeDto, FilterArenaDto, PracticeMatchDto, QueueArenaDto, SubmitArenaAnswerDto } from '../dto';
import { ArenaService } from '../service/arena.service';

@ApiBearerAuth()
@ApiTags('User - Arena')
@UseGuards(JwtAuthGuard)
@DefController('arena')
export class UserArenaController {
  constructor(private readonly service: ArenaService) {}

  @DefGet('me/rating')
  @ApiOperation({ summary: 'Điểm Arena theo kỹ năng' })
  getMyRating(
    @Query('examStructureId') examStructureId: string,
    @Query('examSkillId') examSkillId: string,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.getMyRating(examStructureId || examSkillId, user);
  }

  @DefGet('me/matches')
  @ApiOperation({ summary: 'Trận đấu của tôi' })
  paginationMyMatches(@Body() body: PaginationDto<FilterArenaDto>, @CurrentUser() user: UserDto) {
    return this.service.paginationMyMatches(body, user);
  }

  @DefPost('challenges')
  @ApiOperation({ summary: 'Gửi lời thách đấu' })
  createChallenge(@Body() dto: CreateArenaChallengeDto, @CurrentUser() user: UserDto) {
    return this.service.createChallenge(dto, user);
  }

  @DefPost('queue')
  @ApiOperation({ summary: 'Vào hàng đợi ghép trận' })
  queue(@Body() dto: QueueArenaDto, @CurrentUser() user: UserDto) {
    return this.service.queue(dto, user);
  }

  @DefGet('queue/:id')
  @ApiOperation({ summary: 'Kiểm tra hàng đợi' })
  getQueueTicket(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.getQueueTicket(id, user);
  }

  @DefPost('practice-match')
  @ApiOperation({ summary: 'Tạo trận luyện với bot' })
  practiceMatch(@Body() dto: PracticeMatchDto, @CurrentUser() user: UserDto) {
    return this.service.practiceMatch(dto, user);
  }

  @DefGet('matches/:id')
  @ApiOperation({ summary: 'Chi tiết trận đấu' })
  findMatch(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.findMatch(id, user);
  }

  @DefPost('matches/:id/answers')
  @ApiOperation({ summary: 'Gửi câu trả lời Arena' })
  submitAnswer(@Param('id') id: string, @Body() dto: SubmitArenaAnswerDto, @CurrentUser() user: UserDto) {
    return this.service.submitAnswer(id, dto, user);
  }

  @DefPost('matches/:id/finish')
  @ApiOperation({ summary: 'Kết thúc trận Arena' })
  finishMatch(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.finishMatch(id, user);
  }
}
