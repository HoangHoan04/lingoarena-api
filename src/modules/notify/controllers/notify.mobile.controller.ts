import { Body, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { SubscribeDTO } from '../dto/subscribe.dto';
import { NotifyService } from '../notify.service';

@ApiTags('Mobile - Notify')
@UseGuards(JwtAuthGuard)
@DefController('notify')
export class NotifyMobileController {
  constructor(private readonly service: NotifyService) {}

  @DefPost('subscribe')
  @ApiOperation({ summary: 'Đăng ký token FCM' })
  async subscribeFcmToken(@CurrentUser() userInfo, @Body() body: SubscribeDTO) {
    return await this.service.subscribeFcmToken(userInfo, body);
  }

  @DefPut('update-seen-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả là đã đọc' })
  async updateSeenAll(@CurrentUser() user: UserDto) {
    return await this.service.updateSeenAll(user);
  }

  @DefPut('update-seen-list')
  @ApiOperation({ summary: 'Đánh dấu danh sách thông báo là đã đọc' })
  async updateSeenListNotify(@CurrentUser() user: UserDto, @Body() body: { lstId: string[] }) {
    return await this.service.updateSeenListNotify(user, body);
  }

  @DefGet('find-count-notify-not-seen')
  @ApiOperation({ summary: 'Tìm số thông báo chưa đọc' })
  async findCountNotiNotSeen(@CurrentUser() user: UserDto) {
    return await this.service.findCountNotiNotSeen(user);
  }

  @DefPost('pagination')
  @ApiOperation({ summary: 'Lấy danh sách với bộ lọc' })
  async pagination(@CurrentUser() user: UserDto, @Body() body: PaginationDto<any>) {
    const newBody = { ...body, where: { ...body.where, isAdmin: true } };
    return await this.service.pagination(user, newBody);
  }
}
