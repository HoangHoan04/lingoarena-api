import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { enumData } from '~/common/enums/base.enum';
import { SkipThrottle } from '@nestjs/throttler';
import {
  CurrentUser,
  DefController,
  DefGet,
  DefPatch,
  DefPost,
  DefPut,
} from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import {
  CreateGrammarExampleDto,
  CreateGrammarStructureDto,
  CreateGrammarTopicDto,
  FilterGrammarStructureDto,
  FilterGrammarTopicDto,
  UpdateGrammarExampleDto,
  UpdateGrammarStructureDto,
  UpdateGrammarTopicDto,
} from '../dto';
import { GrammarService } from '../service/grammar.service';

@ApiBearerAuth()
@ApiTags('Admin - Grammar')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('grammar')
export class AdminGrammarController {
  constructor(private readonly service: GrammarService) {}

  @DefGet('lookups/topics')
  @ApiOperation({ summary: 'Select box chủ đề ngữ pháp' })
  selectBoxTopics() {
    return this.service.selectBoxTopics();
  }

  @DefPost('topics/pagination')
  @ApiOperation({ summary: 'Phân trang chủ đề ngữ pháp' })
  paginationTopics(@Body() body: PaginationDto<FilterGrammarTopicDto>) {
    return this.service.paginationTopics(body);
  }

  @DefPost('topics')
  @ApiOperation({ summary: 'Tạo chủ đề ngữ pháp' })
  createTopic(@Body() dto: CreateGrammarTopicDto, @CurrentUser() user: UserDto) {
    return this.service.createTopic(dto, user);
  }

  @SkipThrottle()
  @DefPost('topics/import')
  importTopics(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importTopics(dto, user);
  }

  @DefPost('topics/export-excel')
  exportTopics(@Body() body: PaginationDto<FilterGrammarTopicDto>) {
    return this.service.exportTopics(body);
  }

  @DefGet('topics/:id')
  @ApiOperation({ summary: 'Chi tiết chủ đề ngữ pháp' })
  findTopic(@Param('id') id: string) {
    return this.service.findTopic(id);
  }

  @DefPatch('topics/:id')
  @ApiOperation({ summary: 'Cập nhật chủ đề ngữ pháp' })
  updateTopic(
    @Param('id') id: string,
    @Body() dto: UpdateGrammarTopicDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateTopic(id, dto, user);
  }

  @DefPut('topics/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng chủ đề ngữ pháp' })
  deactivateTopic(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateTopic(id, user);
  }

  @DefPut('topics/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt chủ đề ngữ pháp' })
  activateTopic(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateTopic(id, user);
  }

  @DefPost('structures/pagination')
  @ApiOperation({ summary: 'Phân trang cấu trúc ngữ pháp' })
  paginationStructures(@Body() body: PaginationDto<FilterGrammarStructureDto>) {
    return this.service.paginationStructures(body);
  }

  @DefPost('structures')
  @ApiOperation({ summary: 'Tạo cấu trúc ngữ pháp' })
  createStructure(@Body() dto: CreateGrammarStructureDto, @CurrentUser() user: UserDto) {
    return this.service.createStructure(dto, user);
  }

  @SkipThrottle()
  @DefPost('structures/import')
  importStructures(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importStructures(dto, user);
  }

  @DefPost('structures/export-excel')
  exportStructures(@Body() body: PaginationDto<FilterGrammarStructureDto>) {
    return this.service.exportStructures(body);
  }

  @DefGet('structures/:id')
  @ApiOperation({ summary: 'Chi tiết cấu trúc ngữ pháp' })
  findStructure(@Param('id') id: string) {
    return this.service.findStructure(id);
  }

  @DefPatch('structures/:id')
  @ApiOperation({ summary: 'Cập nhật cấu trúc ngữ pháp' })
  updateStructure(
    @Param('id') id: string,
    @Body() dto: UpdateGrammarStructureDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateStructure(id, dto, user);
  }

  @DefPut('structures/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng cấu trúc ngữ pháp' })
  deactivateStructure(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateStructure(id, user);
  }

  @DefPut('structures/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt cấu trúc ngữ pháp' })
  activateStructure(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateStructure(id, user);
  }

  @DefPost('examples')
  @ApiOperation({ summary: 'Tạo ví dụ ngữ pháp' })
  createExample(@Body() dto: CreateGrammarExampleDto, @CurrentUser() user: UserDto) {
    return this.service.createExample(dto, user);
  }

  @DefPatch('examples/:id')
  @ApiOperation({ summary: 'Cập nhật ví dụ ngữ pháp' })
  updateExample(
    @Param('id') id: string,
    @Body() dto: UpdateGrammarExampleDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateExample(id, dto, user);
  }

  @DefPut('examples/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng ví dụ ngữ pháp' })
  deactivateExample(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateExample(id, user);
  }
}
