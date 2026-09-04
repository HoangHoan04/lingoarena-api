import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { FilterNotificationDto, UpsertNotificationPreferencesDto } from '../dto';
import { NotificationService } from '../service/notification.service';

@ApiBearerAuth()
@ApiTags('User - Notification')
@UseGuards(JwtAuthGuard)
@DefController('notification')
export class UserNotificationController {
  constructor(private readonly service: NotificationService) {}

  @DefPost('me/pagination')
  @ApiOperation({ summary: 'Thông báo của tôi' })
  paginationMe(@Body() body: PaginationDto<FilterNotificationDto>, @CurrentUser() user: UserDto) {
    return this.service.paginationMe(body, user);
  }

  @DefPut('read/:id')
  @ApiOperation({ summary: 'Đánh dấu đã đọc' })
  markRead(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.markRead(id, user);
  }

  @DefGet('me/preferences')
  @ApiOperation({ summary: 'Tùy chọn thông báo' })
  getPreferences(@CurrentUser() user: UserDto) {
    return this.service.getPreferences(user);
  }

  @DefPut('me/preferences')
  @ApiOperation({ summary: 'Cập nhật tùy chọn thông báo' })
  upsertPreferences(@Body() body: UpsertNotificationPreferencesDto, @CurrentUser() user: UserDto) {
    return this.service.upsertPreferences(body.items, user);
  }
}
