import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPatch, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard, JwtOptionalGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { CreateContactDto, CreateSupportTicketDto, CreateTicketMessageDto, FilterSupportDto, UpdateSupportTicketDto } from '../dto';
import { SupportService } from '../service/support.service';

@ApiTags('User - Support')
@DefController('support')
export class UserSupportController {
  constructor(private readonly service: SupportService) {}

  @UseGuards(JwtOptionalGuard)
  @DefPost('contact')
  @ApiOperation({ summary: 'Gửi form liên hệ' })
  contact(@Body() dto: CreateContactDto, @CurrentUser() user?: UserDto) {
    return this.service.createContact(dto, user || undefined);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost('tickets/pagination')
  @ApiOperation({ summary: 'Phiếu hỗ trợ của tôi' })
  pagination(@Body() body: PaginationDto<FilterSupportDto>, @CurrentUser() user: UserDto) {
    return this.service.paginationTickets(body, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost('tickets')
  @ApiOperation({ summary: 'Tạo phiếu hỗ trợ' })
  create(@Body() dto: CreateSupportTicketDto, @CurrentUser() user: UserDto) {
    return this.service.createTicket(dto, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefGet('tickets/:id')
  @ApiOperation({ summary: 'Chi tiết phiếu hỗ trợ' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.findTicket(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPatch('tickets/:id')
  @ApiOperation({ summary: 'Cập nhật phiếu hỗ trợ' })
  update(@Param('id') id: string, @Body() dto: UpdateSupportTicketDto, @CurrentUser() user: UserDto) {
    return this.service.updateTicket(id, dto, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost('tickets/:id/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn phiếu hỗ trợ' })
  addMessage(@Param('id') id: string, @Body() dto: CreateTicketMessageDto, @CurrentUser() user: UserDto) {
    return this.service.addMessage(id, dto, user);
  }
}
