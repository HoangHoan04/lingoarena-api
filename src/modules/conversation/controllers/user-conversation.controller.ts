import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { ConversationService } from '../conversation.service';
import {
  CreateConversationMessageDto,
  CreateSpeakingRoomDto,
  FilterConversationDto,
  JoinSpeakingRoomDto,
  StartAiSessionDto,
} from '../dto';

@ApiBearerAuth()
@ApiTags('User - Conversation')
@UseGuards(JwtAuthGuard)
@DefController('conversation')
export class UserConversationController {
  constructor(private readonly service: ConversationService) {}

  @DefGet('personas')
  @ApiOperation({ summary: 'Danh sách nhân vật AI đang hoạt động' })
  listPersonas() {
    return this.service.listActivePersonas();
  }

  @DefGet('personas/:id')
  @ApiOperation({ summary: 'Chi tiết nhân vật AI' })
  findPersona(@Param('id') id: string) {
    return this.service.findPersona(id);
  }

  @DefPost('speaking-rooms/pagination')
  @ApiOperation({ summary: 'Danh sách phòng luyện nói' })
  paginationSpeakingRooms(@Body() body: PaginationDto<FilterConversationDto>, @CurrentUser() user: UserDto) {
    return this.service.paginationSpeakingRooms(body, user);
  }

  @DefPost('speaking-rooms')
  @ApiOperation({ summary: 'Tạo phòng luyện nói' })
  createSpeakingRoom(@Body() dto: CreateSpeakingRoomDto, @CurrentUser() user: UserDto) {
    return this.service.createSpeakingRoom(dto, user);
  }

  @DefPost('speaking-rooms/:id/join')
  @ApiOperation({ summary: 'Tham gia phòng luyện nói' })
  joinSpeakingRoom(@Param('id') id: string, @Body() dto: JoinSpeakingRoomDto, @CurrentUser() user: UserDto) {
    return this.service.joinSpeakingRoom(id, dto, user);
  }

  @DefPost('ai-sessions/pagination')
  @ApiOperation({ summary: 'Phiên hội thoại AI của tôi' })
  paginationAiSessions(@Body() body: PaginationDto<FilterConversationDto>, @CurrentUser() user: UserDto) {
    return this.service.paginationMyAiSessions(body, user);
  }

  @DefPost('ai-sessions')
  @ApiOperation({ summary: 'Bắt đầu hội thoại AI' })
  startAiSession(@Body() dto: StartAiSessionDto, @CurrentUser() user: UserDto) {
    return this.service.startAiSession(dto, user);
  }

  @DefGet('conversations/:id')
  @ApiOperation({ summary: 'Chi tiết hội thoại' })
  findConversation(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.findConversation(id, user);
  }

  @DefPost('conversations/:id/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn hội thoại' })
  postMessage(@Param('id') id: string, @Body() dto: CreateConversationMessageDto, @CurrentUser() user: UserDto) {
    return this.service.postMessage(id, dto, user);
  }

  @DefPost('conversations/:id/close')
  @ApiOperation({ summary: 'Đóng hội thoại' })
  closeConversation(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.closeConversation(id, user);
  }
}
