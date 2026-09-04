import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser, DefController, DefGet, DefPatch, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { ConversationService } from '../conversation.service';
import { CreateAiTutorPersonaDto, FilterAiTutorPersonaDto, UpdateAiTutorPersonaDto } from '../dto';

@ApiBearerAuth()
@ApiTags('Admin - Conversation')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('conversation')
export class AdminConversationController {
  constructor(private readonly service: ConversationService) {}

  @DefPost('personas/pagination')
  @ApiOperation({ summary: 'Phân trang nhân vật AI' })
  pagination(@Body() body: PaginationDto<FilterAiTutorPersonaDto>) {
    return this.service.paginationPersonas(body);
  }

  @DefGet('personas/select-box')
  @ApiOperation({ summary: 'Select box nhân vật AI' })
  selectBox() {
    return this.service.selectBoxPersonas();
  }

  @DefPost('personas')
  @ApiOperation({ summary: 'Tạo nhân vật AI' })
  create(@Body() dto: CreateAiTutorPersonaDto, @CurrentUser() user: UserDto) {
    return this.service.createPersona(dto, user);
  }

  @SkipThrottle()
  @DefPost('personas/import')
  @ApiOperation({ summary: 'Nhập Excel nhân vật AI' })
  importPersonas(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importPersonas(dto, user);
  }

  @DefPost('personas/export-excel')
  @ApiOperation({ summary: 'Xuất Excel nhân vật AI' })
  exportPersonas(@Body() body: PaginationDto<FilterAiTutorPersonaDto>) {
    return this.service.exportPersonas(body);
  }

  @DefPut('personas/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng nhân vật AI' })
  deactivate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivatePersona(id, user);
  }

  @DefPut('personas/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt nhân vật AI' })
  activate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activatePersona(id, user);
  }

  @DefGet('personas/:id')
  @ApiOperation({ summary: 'Chi tiết nhân vật AI' })
  findOne(@Param('id') id: string) {
    return this.service.findPersona(id);
  }

  @DefPatch('personas/:id')
  @ApiOperation({ summary: 'Cập nhật nhân vật AI' })
  update(@Param('id') id: string, @Body() dto: UpdateAiTutorPersonaDto, @CurrentUser() user: UserDto) {
    return this.service.updatePersona(id, dto, user);
  }
}
