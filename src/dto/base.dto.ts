import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class BaseDto<T, T1> {
  t: T;
  t1: T1;
}

export class UpdateStatusDto {
  @ApiProperty({ description: 'obj id' })
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'status code' })
  @IsNotEmpty()
  status: string;

  @ApiProperty({ description: 'Lý do từ chối' })
  @IsOptional()
  rejectReason: string;
}

export class StatusDto {
  statusName?: string;
  statusCode?: string;
  statusColor?: string;
  statusTextColor?: string;
}

export class FileDto {
  @ApiProperty({ description: 'Image file name' })
  @IsNotEmpty()
  fileName: string;
  @ApiProperty({ description: 'Image file url' })
  @IsNotEmpty()
  fileUrl: string;
  @ApiPropertyOptional({ description: 'Tải ảnh chất lượng cao hay không', default: false })
  isHD?: boolean;
}

export class AttachFileDto {
  @ApiProperty({ description: 'Tên file gốc' })
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'URL file' })
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'Loại file: GALLERY | DIAGRAM | LAYOUT | ...' })
  fileType?: string;

  @ApiPropertyOptional({ description: 'MIME type' })
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Kích thước bytes' })
  fileSize?: number;

  @ApiPropertyOptional({ description: 'Thứ tự hiển thị' })
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Chú thích ảnh' })
  caption?: string;

  @ApiPropertyOptional({ description: 'Tên nhà tài trợ (tournament sponsor logo)' })
  sponsorName?: string;
}
