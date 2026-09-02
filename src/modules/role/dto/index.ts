import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRoleDto extends CreateRoleDto {}

export class FilterRoleDto {
  @ApiPropertyOptional() code?: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() isDeleted?: boolean;
}
