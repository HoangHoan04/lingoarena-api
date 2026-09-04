import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String], description: 'Danh sách mã quyền' })
  @IsOptional()
  @IsArray()
  permissionCodes?: string[];
}

export class UpdateRoleDto extends CreateRoleDto {}

export class FilterRoleDto {
  @ApiPropertyOptional() code?: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() isDeleted?: boolean;
}

export class AssignUserRoleDto {
  @ApiProperty()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  roleId: string;
}
