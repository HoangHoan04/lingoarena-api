import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class VocabularyExampleInputDto {
  @ApiProperty({ description: 'Câu ví dụ tiếng Anh' })
  @IsNotEmpty()
  @IsString()
  sentence: string;

  @ApiProperty({ description: 'Bản dịch tiếng Việt' })
  @IsNotEmpty()
  @IsString()
  translation: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class VocabularyCollocationInputDto {
  @ApiProperty({ example: 'meet a deadline' })
  @IsNotEmpty()
  @IsString()
  collocation: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meaningVi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exampleSentence?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class VocabularyRelationInputDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  relatedVocabularyId: string;

  @ApiProperty({ example: 'synonym', description: 'synonym | antonym | word_family | confusable' })
  @IsNotEmpty()
  @IsString()
  relationType: string;
}

export class CreateVocabularyDto {
  @ApiProperty({ example: 'accomplish' })
  @IsNotEmpty()
  @IsString()
  headword: string;

  @ApiProperty({ example: 'verb' })
  @IsNotEmpty()
  @IsString()
  partOfSpeech: string;

  @ApiProperty({ example: 'to succeed in doing something' })
  @IsNotEmpty()
  @IsString()
  definitionEn: string;

  @ApiProperty({ example: 'hoàn thành, đạt được' })
  @IsNotEmpty()
  @IsString()
  meaningVi: string;

  @ApiPropertyOptional({ example: '/əˈkʌmplɪʃ/' })
  @IsOptional()
  @IsString()
  ipaUk?: string;

  @ApiPropertyOptional({ example: '/əˈkɑːmplɪʃ/' })
  @IsOptional()
  @IsString()
  ipaUs?: string;

  @ApiPropertyOptional({ example: 'B1' })
  @IsOptional()
  @IsString()
  cefrLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  frequencyLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  audioUkAssetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  audioUsAssetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Bỏ qua TTS khi nhập Excel hàng loạt' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  skipAudio?: boolean;

  @ApiPropertyOptional({ type: [VocabularyExampleInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabularyExampleInputDto)
  examples?: VocabularyExampleInputDto[];

  @ApiPropertyOptional({ type: [VocabularyCollocationInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabularyCollocationInputDto)
  collocations?: VocabularyCollocationInputDto[];

  @ApiPropertyOptional({ type: [VocabularyRelationInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabularyRelationInputDto)
  relations?: VocabularyRelationInputDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  topicIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  examTypeIds?: string[];
}

export class UpdateVocabularyDto extends CreateVocabularyDto {}

export class FilterVocabularyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cefrLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partOfSpeech?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;
}

export class FilterNotebookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'new | learning | review | mastered | lapsed' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  dueOnly?: boolean;
}

export class CreateDeckDto {
  @ApiProperty({ example: 'TOEIC Starter' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examTypeId?: string;

  @ApiPropertyOptional({ example: 'A2' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerType?: string;
}

export class UpdateDeckDto extends CreateDeckDto {}

export class FilterDeckDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional({ description: 'toeic | ielts | daily | vstep' })
  @IsOptional()
  @IsString()
  exam?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;
}

export class DeckItemInputDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  vocabularyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ReplaceDeckItemsDto {
  @ApiProperty({ type: [DeckItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeckItemInputDto)
  items: DeckItemInputDto[];
}

export class StartSessionDto {
  @ApiPropertyOptional({ description: 'Bỏ trống = ôn thẻ đến hạn (due mix)' })
  @IsOptional()
  @IsString()
  deckId?: string;

  @ApiProperty({ example: 'FLASHCARD', description: 'FLASHCARD | QUIZ' })
  @IsNotEmpty()
  @IsString()
  mode: string;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}

export class GenerateWordTtsDto {
  @ApiProperty({ example: 'accomplish', description: 'Headword để tạo audio UK/US' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  text: string;

  @ApiPropertyOptional({ description: 'Tạo lại audio dù đã có file' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  force?: boolean;
}

export class AnswerSessionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  vocabularyId: string;

  @ApiPropertyOptional({ description: 'AGAIN | HARD | GOOD | EASY — dùng cho flashcard' })
  @IsOptional()
  @IsString()
  rating?: string;

  @ApiPropertyOptional({ description: 'ID đáp án quiz (vocabularyId của nghĩa được chọn)' })
  @IsOptional()
  @IsString()
  optionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  responseTimeMs?: number;
}
