import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { enumData } from '~/common/enums/base.enum';

export class CreateMediaAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiProperty({ enum: enumData.MEDIA_ASSET_TYPE })
  @IsNotEmpty()
  @IsString()
  assetType: string;

  @ApiPropertyOptional({ default: 's3' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  storageProvider?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  storageKey: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalFilename?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sizeBytes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  durationSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  checksum?: string;

  @ApiPropertyOptional({ default: 'ready' })
  @IsOptional()
  @IsString()
  processingStatus?: string;

  @ApiPropertyOptional({ enum: enumData.VISIBILITY, default: enumData.VISIBILITY.PUBLIC.code })
  @IsOptional()
  @IsString()
  visibility?: string;
}

export class UpdateMediaAssetDto extends CreateMediaAssetDto {}

export class FilterMediaAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assetType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  processingStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;
}
