import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateLeaderboardDto {}

export class UpdateLeaderboardDto extends CreateLeaderboardDto {}

export class FilterLeaderboardDto {
  @ApiPropertyOptional({ description: 'Trạng thái đã xóa' })
  @IsOptional()
  isDeleted?: boolean;

  @ApiPropertyOptional({ description: 'Loại bảng xếp hạng' })
  @IsOptional()
  @IsString()
  boardType?: string;

  @ApiPropertyOptional({ description: 'Kỳ xếp hạng' })
  @IsOptional()
  @IsString()
  period?: string;
}
