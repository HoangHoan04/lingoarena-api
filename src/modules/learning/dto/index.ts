import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateLearningGoalDto {
  @ApiProperty({ description: 'Loại kỳ thi mục tiêu' })
  @IsUUID()
  examTypeId: string;

  @ApiPropertyOptional({ description: 'Điểm hiện tại' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  currentScore?: number;

  @ApiProperty({ description: 'Điểm mục tiêu' })
  @Type(() => Number)
  @IsNumber()
  targetScore: number;

  @ApiPropertyOptional({ description: 'Ngày thi dự kiến' })
  @IsOptional()
  @IsDateString()
  examDate?: string;

  @ApiPropertyOptional({ description: 'Số phút học mỗi ngày', default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minutesPerDay?: number;

  @ApiPropertyOptional({ description: 'Số ngày học mỗi tuần', default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  daysPerWeek?: number;
}

export class CompleteLearningPathItemDto {
  @ApiPropertyOptional({ description: 'Số câu đã trả lời' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  questionsAnswered?: number;

  @ApiPropertyOptional({ description: 'Số câu trả lời đúng' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  questionsCorrect?: number;
}

export class FilterUserErrorItemsDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm theo ghi chú hoặc lý do lỗi' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Lọc lỗi đã xử lý' })
  @IsOptional()
  isResolved?: boolean;
}
