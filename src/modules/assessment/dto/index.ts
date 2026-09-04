import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAssessmentDto {
  @ApiProperty()
  @IsUUID()
  examTypeId: string;

  @ApiPropertyOptional({ description: 'Node kỹ năng (SKILL) của đề' })
  @IsOptional()
  @IsUUID()
  examStructureId?: string;

  @ApiPropertyOptional({ description: 'Alias examStructureId (form Admin)' })
  @IsOptional()
  @IsUUID()
  examSkillId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  assessmentType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAttempts?: number;

  @ApiPropertyOptional()
  @IsOptional()
  passingScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  selectionMode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  showAnswersPolicy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}

export class UpdateAssessmentDto extends PartialType(CreateAssessmentDto) {}

export class FilterAssessmentDto {
  @ApiPropertyOptional({ description: 'Trạng thái đã xóa' })
  @IsOptional()
  isDeleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examTypeId?: string;

  @ApiPropertyOptional({ description: 'Lọc đề theo kỹ năng (node SKILL)' })
  @IsOptional()
  @IsUUID()
  examStructureId?: string;

  @ApiPropertyOptional({ description: 'Alias examStructureId' })
  @IsOptional()
  @IsUUID()
  examSkillId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assessmentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isFree?: boolean;
}

export class CreateAssessmentSectionDto {
  @ApiProperty()
  @IsUUID()
  assessmentId: string;

  @ApiPropertyOptional({ description: 'Node cấu trúc kỳ thi (cấp SKILL)' })
  @IsOptional()
  @IsUUID()
  examStructureId?: string;

  @ApiPropertyOptional({ description: 'Alias examStructureId (tương thích form cũ)' })
  @IsOptional()
  @IsUUID()
  examSkillId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateAssessmentSectionDto extends PartialType(CreateAssessmentSectionDto) {}

export class CreateAssessmentItemDto {
  @ApiProperty()
  @IsUUID()
  assessmentSectionId: string;

  @ApiProperty()
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class UpdateAssessmentItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class StartAssessmentAttemptDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assessmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  clientMetadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  clientClockSkewMs?: number;
}

export class SaveAssessmentAnswerDto {
  @ApiProperty()
  @IsUUID()
  attemptQuestionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  answerJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  answerText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  audioAssetId?: string;
}

export class HeartbeatAssessmentAttemptDto {
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  focusLossCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  clientClockSkewMs?: number;
}

export class CreateRubricDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examTypeId?: string;

  @ApiPropertyOptional({ description: 'Alias examTypeId (form cũ)' })
  @IsOptional()
  @IsUUID()
  examSkillId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  titleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  skillCode?: string;

  @ApiPropertyOptional({ default: 9 })
  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @ApiPropertyOptional({ type: 'array' })
  @IsOptional()
  criteriaJson?: Record<string, unknown>[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;
}

export class UpdateRubricDto extends PartialType(CreateRubricDto) {}

export class FilterRubricDto {
  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examSkillId?: string;
}

export class CreateRubricCriterionDto {
  @ApiProperty()
  @IsUUID()
  rubricId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ default: 9 })
  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateRubricCriterionDto extends PartialType(CreateRubricCriterionDto) {}

export class CreateCertificateTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleEn?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sourceType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minScore?: number;
}

export class UpdateCertificateTemplateDto extends PartialType(CreateCertificateTemplateDto) {}

export class FilterCertificateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examTypeId?: string;
}
