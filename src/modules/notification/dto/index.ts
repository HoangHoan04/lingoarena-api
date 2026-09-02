import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateNotificationDto {}

export class UpdateNotificationDto extends CreateNotificationDto {}

export class FilterNotificationDto {
  @ApiPropertyOptional({ description: 'Trạng thái đã xóa' })
  @IsOptional()
  isDeleted?: boolean;
}
