import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class PaginationFilterNotifyMobileDto {
  @IsOptional()
  category: string;
}

export interface INotifyRefereeCreate {
  lstUserId?: string[];
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  callbackUrl?: string;
  category: string;
  colorType?: string;
}

export class UpdateSeenNotifyDto {
  @ApiProperty({ description: 'Danh sách id' })
  @IsOptional()
  lstId: string[];
}
