import { Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPatch, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import {
  CreateDeckDto,
  CreateVocabularyDto,
  FilterDeckDto,
  FilterVocabularyDto,
  GenerateWordTtsDto,
  ReplaceDeckItemsDto,
  UpdateDeckDto,
  UpdateVocabularyDto,
} from '../dto';
import { VocabularyService } from '../service/vocabulary.service';

@ApiBearerAuth()
@ApiTags('Admin - Vocabulary')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('vocabulary')
export class AdminVocabularyController {
  constructor(private readonly service: VocabularyService) {}

  @DefGet('lookups/topics')
  @ApiOperation({ summary: 'Select box chủ đề' })
  selectBoxTopics() {
    return this.service.selectBoxTopics();
  }

  @DefGet('lookups/exam-types')
  @ApiOperation({ summary: 'Select box loại kỳ thi' })
  selectBoxExamTypes() {
    return this.service.selectBoxExamTypes();
  }

  @DefGet('words/select-box')
  @ApiOperation({ summary: 'Select box từ vựng' })
  selectBoxWords(@Query('keyword') keyword?: string) {
    return this.service.selectBoxWords(keyword);
  }

  @DefPost('words/pagination')
  @ApiOperation({ summary: 'Phân trang từ vựng' })
  paginationWords(@Body() body: PaginationDto<FilterVocabularyDto>) {
    return this.service.paginationWords(body);
  }

  @DefPost('words/tts')
  @ApiOperation({ summary: 'Tạo audio UK/US từ headword (TTS)' })
  generateWordTts(@Body() dto: GenerateWordTtsDto, @CurrentUser() user: UserDto) {
    return this.service.generateWordTts(dto, user);
  }

  @DefGet('words/:id')
  @ApiOperation({ summary: 'Chi tiết từ vựng' })
  findWord(@Param('id') id: string) {
    return this.service.findWord(id);
  }

  @DefPost('words')
  @ApiOperation({ summary: 'Tạo từ vựng' })
  createWord(@Body() dto: CreateVocabularyDto, @CurrentUser() user: UserDto) {
    return this.service.createWord(dto, user);
  }

  @DefPatch('words/:id')
  @ApiOperation({ summary: 'Cập nhật từ vựng' })
  updateWord(
    @Param('id') id: string,
    @Body() dto: UpdateVocabularyDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateWord(id, dto, user);
  }

  @DefPut('words/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng từ vựng' })
  deactivateWord(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateWord(id, user);
  }

  @DefPut('words/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt từ vựng' })
  activateWord(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateWord(id, user);
  }

  @DefPost('decks/pagination')
  @ApiOperation({ summary: 'Phân trang bộ từ' })
  paginationDecks(@Body() body: PaginationDto<FilterDeckDto>) {
    return this.service.paginationDecks(body);
  }

  @DefGet('decks/:id')
  @ApiOperation({ summary: 'Chi tiết bộ từ' })
  findDeck(@Param('id') id: string) {
    return this.service.findDeck(id);
  }

  @DefPost('decks')
  @ApiOperation({ summary: 'Tạo bộ từ' })
  createDeck(@Body() dto: CreateDeckDto, @CurrentUser() user: UserDto) {
    return this.service.createDeck(dto, user);
  }

  @DefPatch('decks/:id')
  @ApiOperation({ summary: 'Cập nhật bộ từ' })
  updateDeck(@Param('id') id: string, @Body() dto: UpdateDeckDto, @CurrentUser() user: UserDto) {
    return this.service.updateDeck(id, dto, user);
  }

  @DefPut('decks/:id/items')
  @ApiOperation({ summary: 'Gán từ vào bộ thẻ' })
  replaceDeckItems(
    @Param('id') id: string,
    @Body() dto: ReplaceDeckItemsDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.replaceDeckItems(id, dto, user);
  }

  @DefPut('decks/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng bộ thẻ' })
  deactivateDeck(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateDeck(id, user);
  }

  @DefPut('decks/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt bộ thẻ' })
  activateDeck(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateDeck(id, user);
  }
}
