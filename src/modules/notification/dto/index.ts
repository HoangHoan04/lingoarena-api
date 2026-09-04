import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class FilterNotificationDto {
  @ApiPropertyOptional({ description: 'Trạng thái đã xóa' })
  @IsOptional()
  isDeleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  unreadOnly?: boolean;
}

export class UpsertNotificationPreferenceDto {
  @ApiProperty({ example: 'in_app' })
  @IsString()
  channel: string;

  @ApiProperty({ example: 'grading_ready' })
  @IsString()
  eventType: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpsertNotificationPreferencesDto {
  @ApiProperty({ type: [UpsertNotificationPreferenceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertNotificationPreferenceDto)
  items: UpsertNotificationPreferenceDto[];
}
