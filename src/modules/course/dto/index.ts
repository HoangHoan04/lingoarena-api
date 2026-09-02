import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { enumData } from '~/common/enums/base.enum';

export class CreateCourseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examTypeId?: string;

  @ApiProperty({ example: 'COURSE-TOEIC-FREE' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'toeic-starter' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  slug: string;

  @ApiProperty({ example: 'TOEIC Starter' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ default: enumData.CEFR_LEVEL.A1.code })
  @IsOptional()
  @IsString()
  levelFrom?: string;

  @ApiPropertyOptional({ default: enumData.CEFR_LEVEL.C1.code })
  @IsOptional()
  @IsString()
  levelTo?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  estimatedMinutes?: number;

  @ApiPropertyOptional({ default: enumData.COURSE_STATUS.DRAFT.code })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: enumData.VISIBILITY.PUBLIC.code })
  @IsOptional()
  @IsString()
  visibility?: string;
}

export class UpdateCourseDto extends CreateCourseDto {}

export class FilterCourseDto {
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
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional({ description: 'Trạng thái đã xóa' })
  @IsOptional()
  isDeleted?: boolean;
}

export class CreateCourseVersionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  changeNote?: string;
}

export class CreateCourseSectionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  courseVersionId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class UpdateCourseSectionDto extends CreateCourseSectionDto {}

export class CreateLessonDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  courseSectionId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ default: enumData.LESSON_TYPE.LECTURE.code })
  @IsOptional()
  @IsString()
  lessonType?: string;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  estimatedMinutes?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ default: enumData.LESSON_STATUS.DRAFT.code })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateLessonDto extends CreateLessonDto {}

export class CreateLessonBlockDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  lessonId: string;

  @ApiProperty({ enum: enumData.LESSON_BLOCK_TYPE })
  @IsNotEmpty()
  @IsString()
  blockType: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  contentJson: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  mediaAssetId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class UpdateLessonBlockDto extends CreateLessonBlockDto {}

export class EnrollCourseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  courseId: string;
}

export class UpdateLessonProgressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  progressPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  lastBlockId?: string;
}
