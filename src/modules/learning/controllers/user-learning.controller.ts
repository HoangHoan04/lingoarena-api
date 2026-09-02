import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { CompleteLearningPathItemDto, CreateLearningGoalDto, FilterUserErrorItemsDto } from '../dto';
import { LearningService } from '../service';

@ApiBearerAuth()
@ApiTags('User - Learning')
@UseGuards(JwtAuthGuard)
@DefController('learning')
export class UserLearningController {
  constructor(private readonly service: LearningService) {}

  @DefPost('goals')
  @ApiOperation({ summary: 'Tạo mục tiêu học tập hiện tại' })
  createGoal(@Body() dto: CreateLearningGoalDto, @CurrentUser() user: UserDto) {
    return this.service.createGoal(dto, user);
  }

  @DefGet('goals')
  @ApiOperation({ summary: 'Danh sách mục tiêu học tập' })
  getGoals(@CurrentUser() user: UserDto) {
    return this.service.getGoals(user);
  }

  @DefGet('goals/current')
  @ApiOperation({ summary: 'Mục tiêu học tập hiện tại' })
  getCurrentGoal(@CurrentUser() user: UserDto) {
    return this.service.getCurrentGoal(user);
  }

  @DefPost('paths/generate')
  @ApiOperation({ summary: 'Tạo lại lộ trình học từ rule engine' })
  generatePath(@CurrentUser() user: UserDto) {
    return this.service.generatePath(user);
  }

  @DefGet('paths/current')
  @ApiOperation({ summary: 'Lộ trình học hiện tại' })
  getCurrentPath(@CurrentUser() user: UserDto) {
    return this.service.getCurrentPath(user);
  }

  @DefPut('items/:id/complete')
  @ApiOperation({ summary: 'Hoàn thành một mục trong lộ trình' })
  completePathItem(
    @Param('id') id: string,
    @Body() dto: CompleteLearningPathItemDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.completePathItem(id, dto, user);
  }

  @DefPost('errors')
  @ApiOperation({ summary: 'Sổ lỗi sai của người học' })
  getErrors(@Body() body: PaginationDto<FilterUserErrorItemsDto>, @CurrentUser() user: UserDto) {
    return this.service.getErrors(body, user);
  }

  @DefGet('activity/today')
  @ApiOperation({ summary: 'Hoạt động học hôm nay' })
  getTodayActivity(@CurrentUser() user: UserDto) {
    return this.service.getTodayActivity(user);
  }
}
