import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard, JwtOptionalGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { FilterGrammarStructureDto, FilterGrammarTopicDto, UpdateGrammarMasteryDto } from '../dto';
import { GrammarService } from '../service/grammar.service';

@ApiTags('User - Grammar')
@DefController('grammar')
export class UserGrammarController {
  constructor(private readonly service: GrammarService) {}

  @UseGuards(JwtOptionalGuard)
  @DefPost('topics/pagination')
  @ApiOperation({ summary: 'Danh sách chủ đề ngữ pháp công khai' })
  paginationTopics(@Body() body: PaginationDto<FilterGrammarTopicDto>) {
    return this.service.paginationTopics({
      ...body,
      where: { ...(body?.where || {}), isDeleted: false },
    });
  }

  @UseGuards(JwtOptionalGuard)
  @DefGet('topics/by-slug/:slug')
  @ApiOperation({ summary: 'Chi tiết chủ đề ngữ pháp theo slug' })
  findTopicBySlug(@Param('slug') slug: string) {
    return this.service.findTopicBySlug(slug);
  }

  @UseGuards(JwtOptionalGuard)
  @DefPost('structures/pagination')
  @ApiOperation({ summary: 'Danh sách cấu trúc ngữ pháp đã duyệt' })
  paginationStructures(@Body() body: PaginationDto<FilterGrammarStructureDto>) {
    return this.service.paginationStructures(body, true);
  }

  @UseGuards(JwtOptionalGuard)
  @DefGet('structures/:id')
  @ApiOperation({ summary: 'Chi tiết cấu trúc ngữ pháp đã duyệt' })
  findStructure(@Param('id') id: string) {
    return this.service.findStructure(id, true);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost('me/mastery')
  @ApiOperation({ summary: 'Cập nhật điểm thành thạo ngữ pháp của tôi' })
  updateMastery(@Body() dto: UpdateGrammarMasteryDto, @CurrentUser() user: UserDto) {
    return this.service.updateMastery(user.id, dto);
  }
}
