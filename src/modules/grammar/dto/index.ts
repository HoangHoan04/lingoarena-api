import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { enumData } from '~/common/enums/base.enum';

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

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional()
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

  @ApiProperty({ example: 'S + V(s/es) + O' })
  @IsNotEmpty()
  @IsString()
  formula: string;

  @ApiProperty({ example: 'Diễn tả thói quen hoặc sự thật hiển nhiên.' })
  @IsNotEmpty()
  @IsString()
  meaningVi: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  usageContent: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commonMistakes?: string;

  @ApiPropertyOptional({
    enum: enumData.CONTENT_REVIEW_STATUS,
    default: enumData.CONTENT_REVIEW_STATUS.DRAFT.code,
  })
  @IsOptional()
  @IsString()
  status?: string;
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
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
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
