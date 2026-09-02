import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateQuestionTypeDto {
  @ApiProperty({ example: 'SINGLE_CHOICE' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Một đáp án' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  answerSchema?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'exact_match' })
  @IsOptional()
  @IsString()
  gradingStrategy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  supportsAutoGrading?: boolean;
}

export class UpdateQuestionTypeDto extends CreateQuestionTypeDto {}

export class FilterQuestionTypeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;
}

export class CreateTopicDto {
  @ApiProperty({ example: 'BUSINESS' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Business' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class UpdateTopicDto extends CreateTopicDto {}

export class FilterTopicDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;
}

export class CreateTagDto {
  @ApiProperty({ example: 'grammar' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;
}

export class UpdateTagDto extends CreateTagDto {}

export class FilterTagDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;
}

export class CreateQuestionGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examSectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: 'passage' })
  @IsOptional()
  @IsString()
  stimulusType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passageText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  audioAssetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  imageAssetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transcript?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateQuestionGroupDto extends CreateQuestionGroupDto {}

export class FilterQuestionGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examSectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;
}

export class QuestionOptionInputDto {
  @ApiProperty({ example: 'A' })
  @IsNotEmpty()
  @IsString()
  optionKey: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class CreateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  questionGroupId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  examTypeId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  examSkillId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examSectionId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  questionTypeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  difficultyLevel?: number;

  @ApiPropertyOptional({ example: 'B1' })
  @IsOptional()
  @IsString()
  cefrLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  defaultPoints?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  prompt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  contentJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  correctAnswerJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  gradingConfigJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  audioAssetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  imageAssetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [QuestionOptionInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionInputDto)
  options?: QuestionOptionInputDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  topicIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tagIds?: string[];
}

export class UpdateQuestionDto extends CreateQuestionDto {}

export class FilterQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examSkillId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examSectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  questionTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  questionGroupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cefrLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  difficultyLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;
}

export class ReviewQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

export class StartPracticeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examSkillId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examSectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  questionTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  topicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cefrLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  difficultyLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class GradePracticeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  questionId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  questionVersionId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  answerJson: Record<string, unknown>;
}
