import { Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { PaginationDto, UserDto, ExcelImportBatchDto } from '~/dto';
import {
  CreateExamSectionDto,
  CreateExamSkillDto,
  CreateExamStructureDto,
  CreateExamTypeDto,
  FilterExamSectionDto,
  FilterExamSkillDto,
  FilterExamStructureDto,
  FilterExamTypeDto,
  UpdateExamSectionDto,
  UpdateExamSkillDto,
  UpdateExamStructureDto,
  UpdateExamTypeDto,
} from '../dto';
import { ExamService } from '../service/exam.service';

@ApiBearerAuth()
@ApiTags('Admin - Exam')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('exam')
export class AdminExamController {
  constructor(private readonly service: ExamService) {}

  @DefGet('lookups/types')
  @ApiOperation({ summary: 'Select box loại kỳ thi' })
  selectBoxTypes() {
    return this.service.selectBoxTypes();
  }

  @DefGet('lookups/skills')
  @ApiOperation({ summary: 'Select box kỹ năng' })
  selectBoxSkills(@Query('examTypeId') examTypeId?: string) {
    return this.service.selectBoxSkills(examTypeId);
  }

  @DefGet('lookups/sections')
  @ApiOperation({ summary: 'Select box phần thi' })
  selectBoxSections(@Query('examSkillId') examSkillId?: string) {
    return this.service.selectBoxSections(examSkillId);
  }

  @DefPost('structures/pagination')
  @ApiOperation({ summary: 'Phân trang cấu trúc kỳ thi' })
  paginationStructures(@Body() body: PaginationDto<FilterExamStructureDto>) {
    return this.service.paginationStructures(body);
  }

  @DefPost('structures')
  @ApiOperation({ summary: 'Tạo node cấu trúc kỳ thi' })
  createStructure(@Body() dto: CreateExamStructureDto, @CurrentUser() user: UserDto) {
    return this.service.createStructure(dto, user);
  }

  @SkipThrottle()
  @DefPost('structures/import')
  @ApiOperation({ summary: 'Nhập Excel cấu trúc kỳ thi' })
  importStructures(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importStructures(dto, user);
  }

  @DefPost('structures/export-excel')
  @ApiOperation({ summary: 'Xuất Excel cấu trúc kỳ thi' })
  exportStructures(@Body() body: PaginationDto<FilterExamStructureDto>) {
    return this.service.exportStructures(body);
  }

  @DefPut('structures/deactivate/:id')
  deactivateStructure(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateStructure(id, user);
  }

  @DefPut('structures/activate/:id')
  activateStructure(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateStructure(id, user);
  }

  @DefGet('structures/:id')
  findStructure(@Param('id') id: string) {
    return this.service.findStructure(id);
  }

  @DefPatch('structures/:id')
  updateStructure(
    @Param('id') id: string,
    @Body() dto: UpdateExamStructureDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateStructure(id, dto, user);
  }

  @DefPost('types/pagination')
  @ApiOperation({ summary: 'Phân trang loại kỳ thi' })
  paginationTypes(@Body() body: PaginationDto<FilterExamTypeDto>) {
    return this.service.paginationTypes(body);
  }

  @DefGet('types/select-box')
  @ApiOperation({ summary: 'Select box loại kỳ thi' })
  typesSelectBox() {
    return this.service.selectBoxTypes();
  }

  @DefPost('types')
  @ApiOperation({ summary: 'Tạo loại kỳ thi' })
  createType(@Body() dto: CreateExamTypeDto, @CurrentUser() user: UserDto) {
    return this.service.createType(dto, user);
  }

  @SkipThrottle()
  @DefPost('types/import')
  @ApiOperation({ summary: 'Nhập Excel loại kỳ thi' })
  importTypes(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importTypes(dto, user);
  }

  @DefPost('types/export-excel')
  @ApiOperation({ summary: 'Xuất Excel loại kỳ thi' })
  exportTypes(@Body() body: PaginationDto<FilterExamTypeDto>) {
    return this.service.exportTypes(body);
  }

  @DefPut('types/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng loại kỳ thi' })
  deactivateType(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateType(id, user);
  }

  @DefPut('types/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt loại kỳ thi' })
  activateType(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateType(id, user);
  }

  @DefGet('types/:id/tree')
  @ApiOperation({ summary: 'Cây kỹ năng / phần thi / số đề của loại kỳ thi' })
  findTypeTree(@Param('id') id: string) {
    return this.service.findTypeTree(id);
  }

  @DefGet('types/:id')
  @ApiOperation({ summary: 'Chi tiết loại kỳ thi' })
  findType(@Param('id') id: string) {
    return this.service.findType(id);
  }

  @DefPatch('types/:id')
  @ApiOperation({ summary: 'Cập nhật loại kỳ thi' })
  updateType(
    @Param('id') id: string,
    @Body() dto: UpdateExamTypeDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateType(id, dto, user);
  }

  @DefPost('skills/pagination')
  @ApiOperation({ summary: 'Phân trang kỹ năng kỳ thi' })
  paginationSkills(@Body() body: PaginationDto<FilterExamSkillDto>) {
    return this.service.paginationSkills(body);
  }

  @DefGet('skills/select-box')
  @ApiOperation({ summary: 'Select box kỹ năng' })
  skillsSelectBox(@Query('examTypeId') examTypeId?: string) {
    return this.service.selectBoxSkills(examTypeId);
  }

  @DefPost('skills')
  @ApiOperation({ summary: 'Tạo kỹ năng kỳ thi' })
  createSkill(@Body() dto: CreateExamSkillDto, @CurrentUser() user: UserDto) {
    return this.service.createSkill(dto, user);
  }

  @DefPut('skills/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng kỹ năng kỳ thi' })
  deactivateSkill(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateSkill(id, user);
  }

  @DefPut('skills/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt kỹ năng kỳ thi' })
  activateSkill(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateSkill(id, user);
  }

  @DefGet('skills/:id')
  @ApiOperation({ summary: 'Chi tiết kỹ năng kỳ thi' })
  findSkill(@Param('id') id: string) {
    return this.service.findSkill(id);
  }

  @DefPatch('skills/:id')
  @ApiOperation({ summary: 'Cập nhật kỹ năng kỳ thi' })
  updateSkill(
    @Param('id') id: string,
    @Body() dto: UpdateExamSkillDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateSkill(id, dto, user);
  }

  @DefPost('sections/pagination')
  @ApiOperation({ summary: 'Phân trang phần thi' })
  paginationSections(@Body() body: PaginationDto<FilterExamSectionDto>) {
    return this.service.paginationSections(body);
  }

  @DefGet('sections/select-box')
  @ApiOperation({ summary: 'Select box phần thi' })
  sectionsSelectBox(@Query('examSkillId') examSkillId?: string) {
    return this.service.selectBoxSections(examSkillId);
  }

  @DefPost('sections')
  @ApiOperation({ summary: 'Tạo phần thi' })
  createSection(@Body() dto: CreateExamSectionDto, @CurrentUser() user: UserDto) {
    return this.service.createSection(dto, user);
  }

  @DefPut('sections/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng phần thi' })
  deactivateSection(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateSection(id, user);
  }

  @DefPut('sections/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt phần thi' })
  activateSection(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateSection(id, user);
  }

  @DefGet('sections/:id')
  @ApiOperation({ summary: 'Chi tiết phần thi' })
  findSection(@Param('id') id: string) {
    return this.service.findSection(id);
  }

  @DefPatch('sections/:id')
  @ApiOperation({ summary: 'Cập nhật phần thi' })
  updateSection(
    @Param('id') id: string,
    @Body() dto: UpdateExamSectionDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateSection(id, dto, user);
  }
}
