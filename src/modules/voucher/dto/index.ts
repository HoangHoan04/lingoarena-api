import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateVoucherDto {
  @ApiProperty()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'BOOKING | TOURNAMENT' })
  @IsNotEmpty()
  voucherType: string;

  @ApiProperty({ description: 'PERCENT | FIXED' })
  @IsNotEmpty()
  discountType: string;

  @ApiProperty()
  @IsNumber()
  discountValue: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxUsage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerTypeId?: string;

  @ApiProperty()
  @IsNotEmpty()
  validFrom: Date;

  @ApiProperty()
  @IsNotEmpty()
  validTo: Date;

  @ApiPropertyOptional()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ type: [String], description: 'Whitelist customer IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  customerIds?: string[];
}

export class UpdateVoucherDto extends CreateVoucherDto {}

export class FilterVoucherDto {
  @ApiPropertyOptional() code?: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() voucherType?: string;
  @ApiPropertyOptional() discountType?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() customerTypeId?: string;
  @ApiPropertyOptional() isDeleted?: boolean;
}

export class AssignVoucherCustomersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  customerIds: string[];
}
