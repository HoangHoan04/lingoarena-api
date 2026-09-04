import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { BULK_IMPORT_MAX_ITEMS } from '~/common/helpers';

export class ExcelImportItemDto {
  @ApiProperty({ required: false, description: 'Số dòng trên file Excel (1-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rowIndex?: number;

  [key: string]: unknown;
}

export class ExcelImportBatchDto {
  @ApiProperty({ type: [ExcelImportItemDto] })
  @IsArray()
  @ArrayMaxSize(BULK_IMPORT_MAX_ITEMS)
  items: ExcelImportItemDto[];
}

export class ExcelCodeLookupDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;
}
