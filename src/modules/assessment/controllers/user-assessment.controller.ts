import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard, JwtOptionalGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import {
  FilterAssessmentDto,
  HeartbeatAssessmentAttemptDto,
  SaveAssessmentAnswerDto,
  StartAssessmentAttemptDto,
} from '../dto';
import { AssessmentService } from '../service/assessment.service';

@ApiTags('User - Assessment')
@DefController('assessment')
export class UserAssessmentController {
  constructor(private readonly service: AssessmentService) {}

  @UseGuards(JwtOptionalGuard)
  @DefPost('pagination')
  pagination(@Body() body: PaginationDto<FilterAssessmentDto>) {
    return this.service.pagination(body, true);
  }

  @UseGuards(JwtOptionalGuard)
  @DefGet('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @DefPost('start')
  start(@Body() dto: StartAssessmentAttemptDto, @CurrentUser() user: UserDto) {
    return this.service.startAttempt(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @DefGet('attempts/:id')
  getAttempt(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.getAttempt(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @DefPost('attempts/:id/heartbeat')
  heartbeat(
    @Param('id') id: string,
    @Body() dto: HeartbeatAssessmentAttemptDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.heartbeatAttempt(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @DefPost('attempts/:id/answers')
  saveAnswer(
    @Param('id') id: string,
    @Body() dto: SaveAssessmentAnswerDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.saveAnswer(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @DefPost('attempts/:id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.submitAttempt(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @DefGet('attempts/:id/result')
  result(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.getResult(id, user);
  }
}
