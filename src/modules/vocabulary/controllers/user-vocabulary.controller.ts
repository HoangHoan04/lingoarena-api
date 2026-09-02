import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard, JwtOptionalGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { AnswerSessionDto, FilterDeckDto, FilterNotebookDto, FilterVocabularyDto, StartSessionDto } from '../dto';
import { VocabularyService } from '../service/vocabulary.service';

@ApiTags('User - Vocabulary')
@DefController('vocabulary')
export class UserVocabularyController {
  constructor(private readonly service: VocabularyService) {}

  @UseGuards(JwtOptionalGuard)
  @DefPost('decks/pagination')
  @ApiOperation({ summary: 'Danh sách bộ từ công khai' })
  pagination(@Body() body: PaginationDto<FilterDeckDto>, @CurrentUser() user?: UserDto) {
    return this.service.publicDeckPagination(body, user?.id);
  }

  @UseGuards(JwtOptionalGuard)
  @DefGet('decks/by-slug/:slug')
  @ApiOperation({ summary: 'Chi tiết bộ từ theo slug' })
  findBySlug(@Param('slug') slug: string, @CurrentUser() user?: UserDto) {
    return this.service.findDeckBySlug(slug, user?.id);
  }

  @UseGuards(JwtOptionalGuard)
  @DefPost('words/pagination')
  @ApiOperation({ summary: 'Tra từ vựng công khai' })
  paginationWords(@Body() body: PaginationDto<FilterVocabularyDto>) {
    return this.service.paginationPublicWords(body);
  }

  @UseGuards(JwtOptionalGuard)
  @DefGet('words/:id')
  @ApiOperation({ summary: 'Chi tiết từ vựng công khai' })
  findWord(@Param('id') id: string) {
    return this.service.findWord(id, true);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefGet('me/stats')
  @ApiOperation({ summary: 'Thống kê từ vựng của tôi' })
  myStats(@CurrentUser() user: UserDto) {
    return this.service.myStats(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost('me/notebook')
  @ApiOperation({ summary: 'Sổ tay từ vựng SRS của tôi' })
  myNotebook(@Body() body: PaginationDto<FilterNotebookDto>, @CurrentUser() user: UserDto) {
    return this.service.myNotebook(user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost('sessions')
  @ApiOperation({ summary: 'Bắt đầu phiên học flashcard hoặc quiz' })
  startSession(@Body() dto: StartSessionDto, @CurrentUser() user: UserDto) {
    return this.service.startSession(dto, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost('sessions/:id/answer')
  @ApiOperation({ summary: 'Trả lời một thẻ / câu quiz' })
  answerSession(
    @Param('id') id: string,
    @Body() dto: AnswerSessionDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.answerSession(id, dto, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost('sessions/:id/complete')
  @ApiOperation({ summary: 'Hoàn thành phiên học' })
  completeSession(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.completeSession(id, user);
  }
}
