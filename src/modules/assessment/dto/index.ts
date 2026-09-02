import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateAssessmentDto {
  @ApiProperty()
  @IsUUID()
  examTypeId: string;

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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

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

  @ApiProperty()
  @IsUUID()
  examSkillId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

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
