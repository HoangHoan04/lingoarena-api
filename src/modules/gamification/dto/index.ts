import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateGamificationDto {}

export class UpdateGamificationDto extends CreateGamificationDto {}

export class FilterGamificationDto {
  @ApiPropertyOptional({ description: 'Trạng thái đã xóa' })
  @IsOptional()
  isDeleted?: boolean;
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
