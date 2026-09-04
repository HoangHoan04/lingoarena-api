import { Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard, JwtOptionalGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import {
  FilterQuestionDto,
  FilterQuestionGroupDto,
  GradePracticeDto,
  StartGroupSessionDto,
  StartPracticeDto,
} from '../dto';
import { QuestionService } from '../service/question.service';

@ApiTags('User - Question')
@DefController('question')
export class UserQuestionController {
  constructor(private readonly service: QuestionService) {}

  @UseGuards(JwtOptionalGuard)
  @DefGet('lookups/exam-types')
  @ApiOperation({ summary: 'Select box loại kỳ thi' })
  selectBoxExamTypes() {
    return this.service.selectBoxExamTypes();
  }

  @UseGuards(JwtOptionalGuard)
  @DefGet('lookups/skills')
  @ApiOperation({ summary: 'Select box kỹ năng' })
  selectBoxSkills(@Query('examTypeId') examTypeId?: string) {
    return this.service.selectBoxSkills(examTypeId);
  }

  @UseGuards(JwtOptionalGuard)
  @DefGet('lookups/sections')
  @ApiOperation({ summary: 'Select box phần thi' })
  selectBoxSections(@Query('examSkillId') examSkillId?: string) {
    return this.service.selectBoxSections(examSkillId);
  }

  @UseGuards(JwtOptionalGuard)
  @DefGet('lookups/question-types')
  @ApiOperation({ summary: 'Select box loại câu hỏi' })
  selectBoxQuestionTypes() {
    return this.service.selectBoxQuestionTypes();
  }

  @UseGuards(JwtOptionalGuard)
  @DefGet('lookups/topics')
  @ApiOperation({ summary: 'Select box chủ đề' })
  selectBoxTopics() {
    return this.service.selectBoxTopics();
  }

  @UseGuards(JwtOptionalGuard)
  @DefPost('questions/pagination')
  @ApiOperation({ summary: 'Ngân hàng câu hỏi đã duyệt' })
  pagination(@Body() body: PaginationDto<FilterQuestionDto>) {
    return this.service.paginationQuestions(body, true);
  }

  @UseGuards(JwtOptionalGuard)
  @DefPost('practice/start')
  @ApiOperation({ summary: 'Bắt đầu luyện câu hỏi tự chấm' })
  startPractice(@Body() dto: StartPracticeDto) {
    return this.service.startPractice(dto);
  }

  @UseGuards(JwtOptionalGuard)
  @DefPost('practice/grade')
  @ApiOperation({ summary: 'Chấm một câu luyện' })
  gradePractice(@Body() dto: GradePracticeDto) {
    return this.service.gradePractice(dto);
  }

  @UseGuards(JwtOptionalGuard)
  @DefPost('groups/pagination')
  @ApiOperation({ summary: 'Danh sách nhóm đọc / nghe đã duyệt' })
  paginationGroups(@Body() body: PaginationDto<FilterQuestionGroupDto>) {
    return this.service.paginationGroups(body, true);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost('groups/:id/start-session')
  @ApiOperation({ summary: 'Bắt đầu phiên đọc hoặc nghe chép' })
  startGroupSession(
    @Param('id') id: string,
    @Body() dto: StartGroupSessionDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.startGroupSession(id, dto, user);
  }

  @UseGuards(JwtOptionalGuard)
  @DefGet('groups/:id')
  @ApiOperation({ summary: 'Chi tiết nhóm đọc / nghe công khai' })
  findGroup(@Param('id') id: string) {
    return this.service.findGroup(id, true);
  }

  @UseGuards(JwtOptionalGuard)
  @DefGet('questions/:id')
  @ApiOperation({ summary: 'Chi tiết câu hỏi công khai' })
  findOne(@Param('id') id: string) {
    return this.service.findQuestion(id, true);
  }
}
