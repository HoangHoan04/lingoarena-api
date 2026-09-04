import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { enumData } from '~/common/enums/base.enum';

export class CreateClassroomDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty()
  @IsUUID()
  teacherUserId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ default: enumData.CLASSROOM_STATUS.ACTIVE.code })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateClassroomDto extends CreateClassroomDto {}

export class FilterClassroomDto {
  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherUserId?: string;
}

export class CreateClassroomMemberDto {
  @ApiProperty()
  @IsUUID()
  classroomId: string;

  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsUUID()
  roleId: string;
}

export class CreateAssignmentDto {
  @ApiProperty()
  @IsUUID()
  classroomId: string;

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

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  assignmentType: string;

  @ApiProperty()
  @IsUUID()
  resourceId: string;

  @ApiProperty()
  @IsDateString()
  dueAt: string;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxScore?: number;
}

export class JoinClassroomDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class SubmitAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assessmentAttemptId?: string;

  @ApiPropertyOptional({ description: 'Alias cũ — map sang assessmentAttemptId' })
  @IsOptional()
  @IsUUID()
  attemptId?: string;

  @ApiPropertyOptional({ description: 'File bài nộp (N file)' })
  @IsOptional()
  @IsUUID('4', { each: true })
  mediaAssetIds?: string[];
}
