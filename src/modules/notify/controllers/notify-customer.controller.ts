import { Body, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { NotifyService } from '../notify.service';

@ApiTags('Customer - Notify')
@DefController('notify')
export class NotifyCustomerController {
  constructor(private readonly service: NotifyService) {}

  @UseGuards(JwtAuthGuard)
  @DefPut('update-seen-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả là đã đọc ( web user)' })
  async updateSeenAllWebUser(@CurrentUser() user: UserDto) {
    return await this.service.updateSeenAll(user);
  }

  @UseGuards(JwtAuthGuard)
  @DefPut('update-seen-all-academy')
  @ApiOperation({ summary: 'Đánh dấu tất cả là đã đọc ( web học viện)' })
  async updateSeenAllWebAcademy(@CurrentUser() user: UserDto) {
    return await this.service.updateSeenAllWebAcademy(user);
  }

  @UseGuards(JwtAuthGuard)
  @DefPut('update-seen-list')
  @ApiOperation({ summary: 'Đánh dấu danh sách thông báo là đã đọc' })
  async updateSeenListNotify(@CurrentUser() user: UserDto, @Body() body: { lstId: string[] }) {
    return await this.service.updateSeenListNotify(user, body);
  }

  @UseGuards(JwtAuthGuard)
  @DefGet('find-count-notify-not-seen')
  @ApiOperation({ summary: 'Tìm số thông báo chưa đọc' })
  async findCountNotiNotSeen(@CurrentUser() user: UserDto) {
    return await this.service.findCountNotiNotSeen(user);
  }

  @UseGuards(JwtAuthGuard)
  @DefPost('pagination')
  @ApiOperation({ summary: 'Lấy danh sách với bộ lọc' })
  async pagination(@CurrentUser() user: UserDto, @Body() body: PaginationDto<any>) {
    return await this.service.pagination(user, body);
  }
}
