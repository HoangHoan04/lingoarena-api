import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPatch, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import {
  CreateAssessmentDto,
  CreateAssessmentItemDto,
  CreateAssessmentSectionDto,
  FilterAssessmentDto,
  UpdateAssessmentDto,
  UpdateAssessmentItemDto,
  UpdateAssessmentSectionDto,
} from '../dto';
import { AssessmentService } from '../service/assessment.service';

@ApiBearerAuth()
@ApiTags('Admin - Assessment')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('assessment')
export class AdminAssessmentController {
  constructor(private readonly service: AssessmentService) {}

  @DefPost('pagination')
  pagination(@Body() body: PaginationDto<FilterAssessmentDto>) {
    return this.service.pagination(body);
  }

  @DefPost()
  create(@Body() dto: CreateAssessmentDto, @CurrentUser() user: UserDto) {
    return this.service.create(dto, user);
  }

  @DefGet(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @DefPatch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssessmentDto, @CurrentUser() user: UserDto) {
    return this.service.update(id, dto, user);
  }

  @DefPut('publish/:id')
  publish(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.publish(id, user);
  }

  @DefPut('archive/:id')
  archive(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.archive(id, user);
  }

  @DefPut('deactivate/:id')
  deactivate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivate(id, user);
  }

  @DefPut('activate/:id')
  activate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activate(id, user);
  }

  @DefPost('sections')
  createSection(@Body() dto: CreateAssessmentSectionDto, @CurrentUser() user: UserDto) {
    return this.service.createSection(dto, user);
  }

  @DefPatch('sections/:id')
  updateSection(
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentSectionDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateSection(id, dto, user);
  }

  @DefPut('sections/deactivate/:id')
  deactivateSection(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateSection(id, user);
  }

  @DefPost('items')
  createItem(@Body() dto: CreateAssessmentItemDto, @CurrentUser() user: UserDto) {
    return this.service.createItem(dto, user);
  }

  @DefPut('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateAssessmentItemDto, @CurrentUser() user: UserDto) {
    return this.service.updateItem(id, dto, user);
  }

  @DefPut('items/deactivate/:id')
  deactivateItem(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateItem(id, user);
  }

  @DefPost('attempts/pagination')
  paginationAttempts(@Body() body: PaginationDto<FilterAssessmentDto>) {
    return this.service.paginationAttempts(body);
  }
}
