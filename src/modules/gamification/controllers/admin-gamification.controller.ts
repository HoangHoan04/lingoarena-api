import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser, DefController, DefGet, DefPatch, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import {
  CreateAchievementDto,
  CreateDailyChallengeAdminDto,
  FilterGamificationDto,
  UpdateAchievementDto,
  UpdateDailyChallengeAdminDto,
} from '../dto';
import { GamificationService } from '../service/gamification.service';

@ApiBearerAuth()
@ApiTags('Admin - Gamification')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('gamification')
export class AdminGamificationController {
  constructor(private readonly service: GamificationService) {}

  @DefPost('achievements/pagination')
  @ApiOperation({ summary: 'Phân trang thành tích' })
  paginationAchievements(@Body() body: PaginationDto<FilterGamificationDto>) {
    return this.service.paginationAchievements(body);
  }

  @DefPost('achievements')
  @ApiOperation({ summary: 'Tạo thành tích' })
  createAchievement(@Body() dto: CreateAchievementDto, @CurrentUser() user: UserDto) {
    return this.service.createAchievement(dto, user);
  }

  @SkipThrottle()
  @DefPost('achievements/import')
  @ApiOperation({ summary: 'Nhập Excel thành tích' })
  importAchievements(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importAchievements(dto, user);
  }

  @DefPost('achievements/export-excel')
  @ApiOperation({ summary: 'Xuất Excel thành tích' })
  exportAchievements(@Body() body: PaginationDto<FilterGamificationDto>) {
    return this.service.exportAchievements(body);
  }

  @DefGet('achievements/:id')
  @ApiOperation({ summary: 'Chi tiết thành tích' })
  findAchievement(@Param('id') id: string) {
    return this.service.findAchievement(id);
  }

  @DefPatch('achievements/:id')
  @ApiOperation({ summary: 'Cập nhật thành tích' })
  updateAchievement(@Param('id') id: string, @Body() dto: UpdateAchievementDto, @CurrentUser() user: UserDto) {
    return this.service.updateAchievement(id, dto, user);
  }

  @DefPut('achievements/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng thành tích' })
  deactivateAchievement(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateAchievement(id, user);
  }

  @DefPut('achievements/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt thành tích' })
  activateAchievement(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateAchievement(id, user);
  }

  @DefPost('daily-challenges/pagination')
  @ApiOperation({ summary: 'Phân trang thử thách ngày' })
  paginationDailyChallenges(@Body() body: PaginationDto<FilterGamificationDto>) {
    return this.service.paginationDailyChallenges(body);
  }

  @DefPost('daily-challenges')
  @ApiOperation({ summary: 'Tạo thử thách ngày' })
  createDailyChallenge(@Body() dto: CreateDailyChallengeAdminDto, @CurrentUser() user: UserDto) {
    return this.service.createDailyChallenge(dto, user);
  }

  @SkipThrottle()
  @DefPost('daily-challenges/import')
  @ApiOperation({ summary: 'Nhập Excel thử thách ngày' })
  importDailyChallenges(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importDailyChallenges(dto, user);
  }

  @DefPost('daily-challenges/export-excel')
  @ApiOperation({ summary: 'Xuất Excel thử thách ngày' })
  exportDailyChallenges(@Body() body: PaginationDto<FilterGamificationDto>) {
    return this.service.exportDailyChallenges(body);
  }

  @DefGet('daily-challenges/:id')
  @ApiOperation({ summary: 'Chi tiết thử thách ngày' })
  findDailyChallenge(@Param('id') id: string) {
    return this.service.findDailyChallenge(id);
  }

  @DefPatch('daily-challenges/:id')
  @ApiOperation({ summary: 'Cập nhật thử thách ngày' })
  updateDailyChallenge(
    @Param('id') id: string,
    @Body() dto: UpdateDailyChallengeAdminDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateDailyChallenge(id, dto, user);
  }

  @DefPut('daily-challenges/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng thử thách ngày' })
  deactivateDailyChallenge(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateDailyChallenge(id, user);
  }

  @DefPut('daily-challenges/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt thử thách ngày' })
  activateDailyChallenge(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateDailyChallenge(id, user);
  }
}
