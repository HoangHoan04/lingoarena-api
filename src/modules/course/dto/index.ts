import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
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
  @MaxLength(255)
  titleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescriptionEn?: string;

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
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Alias courseId (form cũ dùng courseVersionId)' })
  @IsOptional()
  @IsUUID()
  courseVersionId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleEn?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleEn?: string;

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

  @ApiPropertyOptional({ description: 'Khối bài học vừa hoàn thành' })
  @IsOptional()
  @IsUUID()
  blockId?: string;

  @ApiPropertyOptional({ description: 'Vị trí đang xem trong bài' })
  @IsOptional()
  @IsObject()
  lastPositionJson?: Record<string, unknown>;
}

export class CreateCourseInstructorDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ default: 'lead_instructor' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;
}

export class CreateCourseReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
