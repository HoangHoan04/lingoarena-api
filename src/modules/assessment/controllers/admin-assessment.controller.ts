import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  CreateAssessmentDto,
  CreateAssessmentItemDto,
  CreateAssessmentSectionDto,
  CreateCertificateTemplateDto,
  CreateRubricCriterionDto,
  CreateRubricDto,
  FilterAssessmentDto,
  FilterCertificateTemplateDto,
  FilterRubricDto,
  UpdateAssessmentDto,
  UpdateAssessmentItemDto,
  UpdateAssessmentSectionDto,
  UpdateCertificateTemplateDto,
  UpdateRubricCriterionDto,
  UpdateRubricDto,
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

  @SkipThrottle()
  @DefPost('import')
  importAssessments(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importAssessments(dto, user);
  }

  @DefPost('export-excel')
  exportAssessments(@Body() body: PaginationDto<FilterAssessmentDto>) {
    return this.service.exportAssessments(body);
  }

  @DefGet(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @DefPatch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssessmentDto, @CurrentUser() user: UserDto) {
    return this.service.update(id, dto, user);
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
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentItemDto,
    @CurrentUser() user: UserDto,
  ) {
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

  @DefPost('rubrics/pagination')
  paginationRubrics(@Body() body: PaginationDto<FilterRubricDto>) {
    return this.service.paginationRubrics(body);
  }

  @DefPost('rubrics')
  createRubric(@Body() dto: CreateRubricDto, @CurrentUser() user: UserDto) {
    return this.service.createRubric(dto, user);
  }

  @SkipThrottle()
  @DefPost('rubrics/import')
  importRubrics(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importRubrics(dto, user);
  }

  @DefPost('rubrics/export-excel')
  exportRubrics(@Body() body: PaginationDto<FilterRubricDto>) {
    return this.service.exportRubrics(body);
  }

  @DefGet('rubrics/:id')
  findRubric(@Param('id') id: string) {
    return this.service.findRubric(id);
  }

  @DefPatch('rubrics/:id')
  updateRubric(
    @Param('id') id: string,
    @Body() dto: UpdateRubricDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateRubric(id, dto, user);
  }

  @DefPut('rubrics/deactivate/:id')
  deactivateRubric(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateRubric(id, user);
  }

  @DefPut('rubrics/activate/:id')
  activateRubric(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateRubric(id, user);
  }

  @DefPost('rubric-criteria')
  createRubricCriterion(@Body() dto: CreateRubricCriterionDto, @CurrentUser() user: UserDto) {
    return this.service.createRubricCriterion(dto, user);
  }

  @DefPatch('rubric-criteria/:id')
  updateRubricCriterion(
    @Param('id') id: string,
    @Body() dto: UpdateRubricCriterionDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateRubricCriterion(id, dto, user);
  }

  @DefPut('rubric-criteria/deactivate/:id')
  deactivateRubricCriterion(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateRubricCriterion(id, user);
  }

  @DefPost('certificate-templates/pagination')
  paginationCertificateTemplates(@Body() body: PaginationDto<FilterCertificateTemplateDto>) {
    return this.service.paginationCertificateTemplates(body);
  }

  @DefPost('certificate-templates')
  createCertificateTemplate(
    @Body() dto: CreateCertificateTemplateDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.createCertificateTemplate(dto, user);
  }

  @DefGet('certificate-templates/:id')
  findCertificateTemplate(@Param('id') id: string) {
    return this.service.findCertificateTemplate(id);
  }

  @DefPatch('certificate-templates/:id')
  updateCertificateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateCertificateTemplateDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateCertificateTemplate(id, dto, user);
  }

  @DefPut('certificate-templates/deactivate/:id')
  deactivateCertificateTemplate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateCertificateTemplate(id, user);
  }

  @DefPut('certificate-templates/activate/:id')
  activateCertificateTemplate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateCertificateTemplate(id, user);
  }

  @DefPost('grading-tasks/:id/run')
  runGradingTask(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.runGradingTask(id, user);
  }
}
