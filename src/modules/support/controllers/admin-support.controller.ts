import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPatch, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { CreateTicketMessageDto, FilterSupportDto, PatchTicketStatusDto } from '../dto';
import { SupportService } from '../service/support.service';

@ApiBearerAuth()
@ApiTags('Admin - Support')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('support')
export class AdminSupportController {
  constructor(private readonly service: SupportService) {}

  @DefPost('tickets/pagination')
  @ApiOperation({ summary: 'Phân trang phiếu hỗ trợ' })
  pagination(@Body() body: PaginationDto<FilterSupportDto>) {
    return this.service.paginationTickets(body);
  }

  @DefGet('tickets/:id')
  @ApiOperation({ summary: 'Chi tiết phiếu hỗ trợ' })
  findOne(@Param('id') id: string) {
    return this.service.findTicket(id);
  }

  @DefPatch('tickets/:id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái phiếu' })
  patchStatus(@Param('id') id: string, @Body() dto: PatchTicketStatusDto, @CurrentUser() user: UserDto) {
    return this.service.patchStatus(id, dto, user);
  }

  @DefPost('tickets/:id/messages')
  @ApiOperation({ summary: 'Trả lời phiếu hỗ trợ' })
  reply(@Param('id') id: string, @Body() dto: CreateTicketMessageDto, @CurrentUser() user: UserDto) {
    return this.service.addMessage(id, dto, user, true);
  }
}
