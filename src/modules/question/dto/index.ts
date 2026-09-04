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
  @IsString()
  @MaxLength(100)
  nameEn?: string;

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
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

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
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  slug?: string;
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

export class ContentSegmentInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  sortOrder: number;

  @ApiPropertyOptional({ example: 'Paragraph A' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  translationVi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  startSec?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  endSec?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  keyVocabJson?: Record<string, unknown>[];
}

export class CreateQuestionGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examStructureId?: string;

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
  titleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructionsEn?: string;

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
  @IsString()
  summaryVi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  wordCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  recommendedTimeMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cefrLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  youtubeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channelName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channelAvatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  durationSec?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  keyVocabJson?: Record<string, unknown>[];

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
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transcript?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [ContentSegmentInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentSegmentInputDto)
  segments?: ContentSegmentInputDto[];
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
  examTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examStructureId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examSectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stimulusType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cefrLevel?: string;

  @ApiPropertyOptional({ description: 'Lọc nhóm có câu hỏi gắn chủ đề (taxonomy) này' })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({ description: 'Lọc bài luyện nghe (có audio hoặc video)' })
  @IsOptional()
  hasAudio?: boolean;

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
  @IsString()
  feedbackEn?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examStructureId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examSkillId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examSectionId?: string;

  @ApiPropertyOptional({ example: 'SINGLE_CHOICE' })
  @IsOptional()
  @IsString()
  questionType?: string;

  @ApiPropertyOptional({ example: 'SINGLE_CHOICE' })
  @IsOptional()
  @IsString()
  questionTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  questionNumber?: number;

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
  gradingStrategy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  rubricId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minWords?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxWords?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  timeLimitMin?: number;

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
  instructionsEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanationEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sampleAnswer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sampleBand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sampleAnalysisVi?: string;

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
  @IsObject()
  metaJson?: Record<string, unknown>;

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
  examStructureId?: string;

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
  questionType?: string;

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
  examStructureId?: string;

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
  @IsString()
  questionType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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
  @IsObject()
  answerJson: Record<string, unknown>;
}

export class StartGroupSessionDto {
  @ApiPropertyOptional({ example: 'READING', description: 'READING hoặc DICTATION. Bỏ trống thì suy ra từ stimulusType.' })
  @IsOptional()
  @IsString()
  sessionType?: string;
}
