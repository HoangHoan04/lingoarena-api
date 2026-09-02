import { Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DefController, DefGet } from '~/common/core/decorator';
import { JwtOptionalGuard } from '~/common/guards';
import { ExamService } from '../service/exam.service';

@ApiTags('User - Exam')
@DefController('exam')
export class UserExamController {
  constructor(private readonly service: ExamService) {}

  @UseGuards(JwtOptionalGuard)
  @DefGet('lookups/types')
  @ApiOperation({ summary: 'Select box loại kỳ thi' })
  selectBoxTypes() {
    return this.service.selectBoxTypes();
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
}
