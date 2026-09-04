import { Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser, DefController, DefGet, DefPatch, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { PaginationDto, UserDto, ExcelImportBatchDto } from '~/dto';
import {
  CreateQuestionDto,
  CreateQuestionGroupDto,
  CreateQuestionTypeDto,
  CreateTagDto,
  CreateTopicDto,
  FilterQuestionDto,
  FilterQuestionGroupDto,
  FilterQuestionTypeDto,
  FilterTagDto,
  FilterTopicDto,
  UpdateQuestionDto,
  UpdateQuestionGroupDto,
  UpdateQuestionTypeDto,
  UpdateTagDto,
  UpdateTopicDto,
} from '../dto';
import { QuestionService } from '../service/question.service';

@ApiBearerAuth()
@ApiTags('Admin - Question')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('question')
export class AdminQuestionController {
  constructor(private readonly service: QuestionService) {}

  @DefGet('lookups/exam-types')
  @ApiOperation({ summary: 'Select box loại kỳ thi' })
  selectBoxExamTypes() {
    return this.service.selectBoxExamTypes();
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

  @DefGet('lookups/question-types')
  @ApiOperation({ summary: 'Select box loại câu hỏi' })
  selectBoxQuestionTypes() {
    return this.service.selectBoxQuestionTypes();
  }

  @DefGet('lookups/topics')
  @ApiOperation({ summary: 'Select box chủ đề' })
  selectBoxTopics() {
    return this.service.selectBoxTopics();
  }

  @DefGet('lookups/tags')
  @ApiOperation({ summary: 'Select box thẻ' })
  selectBoxTags() {
    return this.service.selectBoxTags();
  }

  @DefGet('lookups/groups')
  @ApiOperation({ summary: 'Select box nhóm câu hỏi' })
  selectBoxGroups(@Query('keyword') keyword?: string) {
    return this.service.selectBoxGroups(keyword);
  }

  @DefPost('types/pagination')
  @ApiOperation({ summary: 'Phân trang loại câu hỏi' })
  paginationTypes(@Body() body: PaginationDto<FilterQuestionTypeDto>) {
    return this.service.paginationTypes(body);
  }

  @DefGet('types/select-box')
  @ApiOperation({ summary: 'Select box loại câu hỏi' })
  typesSelectBox() {
    return this.service.selectBoxQuestionTypes();
  }

  @DefPost('types')
  @ApiOperation({ summary: 'Tạo loại câu hỏi' })
  createType(@Body() dto: CreateQuestionTypeDto, @CurrentUser() user: UserDto) {
    return this.service.createType(dto, user);
  }

  @DefPut('types/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng loại câu hỏi' })
  deactivateType(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateType(id, user);
  }

  @DefPut('types/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt loại câu hỏi' })
  activateType(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateType(id, user);
  }

  @DefGet('types/:id')
  @ApiOperation({ summary: 'Chi tiết loại câu hỏi' })
  findType(@Param('id') id: string) {
    return this.service.findType(id);
  }

  @DefPatch('types/:id')
  @ApiOperation({ summary: 'Cập nhật loại câu hỏi' })
  updateType(@Param('id') id: string, @Body() dto: UpdateQuestionTypeDto, @CurrentUser() user: UserDto) {
    return this.service.updateType(id, dto, user);
  }

  @DefPost('topics/pagination')
  @ApiOperation({ summary: 'Phân trang chủ đề' })
  paginationTopics(@Body() body: PaginationDto<FilterTopicDto>) {
    return this.service.paginationTopics(body);
  }

  @DefGet('topics/select-box')
  @ApiOperation({ summary: 'Select box chủ đề' })
  topicsSelectBox() {
    return this.service.selectBoxTopics();
  }

  @DefPost('topics')
  @ApiOperation({ summary: 'Tạo chủ đề' })
  createTopic(@Body() dto: CreateTopicDto, @CurrentUser() user: UserDto) {
    return this.service.createTopic(dto, user);
  }

  @SkipThrottle()
  @DefPost('topics/import')
  @ApiOperation({ summary: 'Nhập Excel chủ đề' })
  importTopics(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importTopics(dto, user);
  }

  @DefPost('topics/export-excel')
  @ApiOperation({ summary: 'Xuất Excel chủ đề' })
  exportTopics(@Body() body: PaginationDto<FilterTopicDto>) {
    return this.service.exportTopics(body);
  }

  @DefPut('topics/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng chủ đề' })
  deactivateTopic(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateTopic(id, user);
  }

  @DefPut('topics/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt chủ đề' })
  activateTopic(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateTopic(id, user);
  }

  @DefGet('topics/:id')
  @ApiOperation({ summary: 'Chi tiết chủ đề' })
  findTopic(@Param('id') id: string) {
    return this.service.findTopic(id);
  }

  @DefPatch('topics/:id')
  @ApiOperation({ summary: 'Cập nhật chủ đề' })
  updateTopic(@Param('id') id: string, @Body() dto: UpdateTopicDto, @CurrentUser() user: UserDto) {
    return this.service.updateTopic(id, dto, user);
  }

  @DefPost('tags/pagination')
  @ApiOperation({ summary: 'Phân trang thẻ' })
  paginationTags(@Body() body: PaginationDto<FilterTagDto>) {
    return this.service.paginationTags(body);
  }

  @DefGet('tags/select-box')
  @ApiOperation({ summary: 'Select box thẻ' })
  tagsSelectBox() {
    return this.service.selectBoxTags();
  }

  @DefPost('tags')
  @ApiOperation({ summary: 'Tạo thẻ' })
  createTag(@Body() dto: CreateTagDto, @CurrentUser() user: UserDto) {
    return this.service.createTag(dto, user);
  }

  @SkipThrottle()
  @DefPost('tags/import')
  @ApiOperation({ summary: 'Nhập Excel thẻ' })
  importTags(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importTags(dto, user);
  }

  @DefPost('tags/export-excel')
  @ApiOperation({ summary: 'Xuất Excel thẻ' })
  exportTags(@Body() body: PaginationDto<FilterTagDto>) {
    return this.service.exportTags(body);
  }

  @DefPut('tags/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng thẻ' })
  deactivateTag(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateTag(id, user);
  }

  @DefPut('tags/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt thẻ' })
  activateTag(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateTag(id, user);
  }

  @DefGet('tags/:id')
  @ApiOperation({ summary: 'Chi tiết thẻ' })
  findTag(@Param('id') id: string) {
    return this.service.findTag(id);
  }

  @DefPatch('tags/:id')
  @ApiOperation({ summary: 'Cập nhật thẻ' })
  updateTag(@Param('id') id: string, @Body() dto: UpdateTagDto, @CurrentUser() user: UserDto) {
    return this.service.updateTag(id, dto, user);
  }

  @DefPost('groups/pagination')
  @ApiOperation({ summary: 'Phân trang nhóm câu hỏi' })
  paginationGroups(@Body() body: PaginationDto<FilterQuestionGroupDto>) {
    return this.service.paginationGroups(body);
  }

  @DefPost('groups')
  @ApiOperation({ summary: 'Tạo nhóm câu hỏi' })
  createGroup(@Body() dto: CreateQuestionGroupDto, @CurrentUser() user: UserDto) {
    return this.service.createGroup(dto, user);
  }

  @SkipThrottle()
  @DefPost('groups/import')
  @ApiOperation({ summary: 'Nhập Excel bài đọc / nghe' })
  importGroups(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importGroups(dto, user);
  }

  @DefPost('groups/export-excel')
  @ApiOperation({ summary: 'Xuất Excel bài đọc / nghe' })
  exportGroups(@Body() body: PaginationDto<FilterQuestionGroupDto>) {
    return this.service.exportGroups(body);
  }

  @DefPut('groups/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng nhóm câu hỏi' })
  deactivateGroup(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateGroup(id, user);
  }

  @DefPut('groups/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt nhóm câu hỏi' })
  activateGroup(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateGroup(id, user);
  }

  @DefGet('groups/youtube-transcript/:youtubeId')
  @ApiOperation({ summary: 'Lấy phụ đề có mốc thời gian từ YouTube' })
  getYoutubeTranscript(@Param('youtubeId') youtubeId: string) {
    return this.service.getYoutubeTranscript(youtubeId);
  }

  @DefPost('groups/translate-segments')
  @ApiOperation({ summary: 'Dịch tự động danh sách câu sang tiếng Việt' })
  translateSegments(@Body() body: { texts: string[] }) {
    return this.service.translateSegments(body?.texts || []);
  }

  @DefGet('groups/:id')
  @ApiOperation({ summary: 'Chi tiết nhóm câu hỏi' })
  findGroup(@Param('id') id: string) {
    return this.service.findGroup(id);
  }

  @DefPatch('groups/:id')
  @ApiOperation({ summary: 'Cập nhật nhóm câu hỏi' })
  updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionGroupDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateGroup(id, dto, user);
  }

  @DefPost('questions/pagination')
  @ApiOperation({ summary: 'Phân trang câu hỏi' })
  paginationQuestions(@Body() body: PaginationDto<FilterQuestionDto>) {
    return this.service.paginationQuestions(body);
  }

  @DefPost('questions')
  @ApiOperation({ summary: 'Tạo câu hỏi' })
  createQuestion(@Body() dto: CreateQuestionDto, @CurrentUser() user: UserDto) {
    return this.service.createQuestion(dto, user);
  }

  @SkipThrottle()
  @DefPost('questions/import')
  @ApiOperation({ summary: 'Nhập Excel câu hỏi' })
  importQuestions(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importQuestions(dto, user);
  }

  @DefPut('questions/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng câu hỏi' })
  deactivateQuestion(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateQuestion(id, user);
  }

  @DefPut('questions/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt câu hỏi' })
  activateQuestion(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateQuestion(id, user);
  }

  @DefPost('questions/export-excel')
  @ApiOperation({ summary: 'Xuất danh sách câu hỏi' })
  exportQuestions(@Body() body: PaginationDto<FilterQuestionDto>) {
    return this.service.exportQuestions(body);
  }

  @DefGet('questions/:id')
  @ApiOperation({ summary: 'Chi tiết câu hỏi' })
  findQuestion(@Param('id') id: string) {
    return this.service.findQuestion(id);
  }

  @DefPatch('questions/:id')
  @ApiOperation({ summary: 'Cập nhật câu hỏi' })
  updateQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateQuestion(id, dto, user);
  }

  @DefPut('questions/:id/detach-group')
  @ApiOperation({ summary: 'Gỡ câu hỏi khỏi nhóm / bài đọc' })
  detachQuestionFromGroup(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.detachQuestionFromGroup(id, user);
  }
}

