import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class FilterGamificationDto {
  @ApiPropertyOptional({ description: 'Trạng thái đã xóa' })
  @IsOptional()
  isDeleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class ChallengeProgressDto {
  @ApiProperty({ description: 'Số lượng tăng thêm', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  increment: number;
}

export class PracticePointsDto {
  @ApiProperty({ description: 'Số câu luyện tập đã hoàn thành' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  count: number;
}

export class CreateAchievementDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  code: string;

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
  category: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  iconMediaAssetId?: string;

  @ApiProperty()
  @IsObject()
  conditionJson: Record<string, unknown>;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  points?: number;
}

export class UpdateAchievementDto extends CreateAchievementDto {}

export class CreateDailyChallengeAdminDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

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
  challengeType: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetCount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rewardPoints?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activeDate?: string;
}

export class UpdateDailyChallengeAdminDto extends CreateDailyChallengeAdminDto {}
