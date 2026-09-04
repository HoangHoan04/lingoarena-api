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
import { enumData } from '~/common/enums/base.enum';

export class GrammarExampleJsonDto {
  @ApiPropertyOptional({
    description: 'ID phần tử trong examplesJson (tạo khi dùng API examples/*)',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'She goes to school every day.' })
  @IsNotEmpty()
  @IsString()
  sentence: string;

  @ApiProperty({ example: 'Cô ấy đi học mỗi ngày.' })
  @IsNotEmpty()
  @IsString()
  translation: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isNegativeExample?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class CreateGrammarTopicDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ example: 'Present Simple' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleEn?: string;

  @ApiProperty({ example: 'present-simple' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({ enum: enumData.CEFR_LEVEL, default: enumData.CEFR_LEVEL.A2.code })
  @IsOptional()
  @IsString()
  cefrLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Không còn cột riêng — bỏ qua khi lưu' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Không còn cột canonicalTopicId — bỏ qua khi lưu' })
  @IsOptional()
  @IsUUID()
  canonicalTopicId?: string;
}

export class UpdateGrammarTopicDto extends CreateGrammarTopicDto {}

export class FilterGrammarTopicDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cefrLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  canonicalTopicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;
}

export class CreateGrammarStructureDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  grammarTopicId: string;

  @ApiProperty({ example: 'Present Simple: affirmative' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleEn?: string;

  @ApiProperty({ example: 'S + V(s/es) + O' })
  @IsNotEmpty()
  @IsString()
  formula: string;

  @ApiProperty({ example: 'Diễn tả thói quen hoặc sự thật hiển nhiên.' })
  @IsNotEmpty()
  @IsString()
  meaningVi: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meaningEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  usageContent?: string;

  @ApiPropertyOptional({ description: 'Không còn cột riêng — bỏ qua khi lưu' })
  @IsOptional()
  @IsString()
  usageContentEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commonMistakes?: string;

  @ApiPropertyOptional({ description: 'Không còn cột riêng — bỏ qua khi lưu' })
  @IsOptional()
  @IsString()
  commonMistakesEn?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({
    type: [GrammarExampleJsonDto],
    description: 'Ví dụ minh họa — thay bảng grammar_examples',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrammarExampleJsonDto)
  examplesJson?: GrammarExampleJsonDto[];
}

export class UpdateGrammarStructureDto extends CreateGrammarStructureDto {}

export class FilterGrammarStructureDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  grammarTopicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}

export class CreateGrammarExampleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  grammarStructureId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  sentence: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  translation: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isNegativeExample?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class UpdateGrammarExampleDto extends CreateGrammarExampleDto {}

export class UpdateGrammarMasteryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  grammarStructureId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isCorrect: boolean;
}
