import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateClassroomDto {}

export class UpdateClassroomDto extends CreateClassroomDto {}

export class FilterClassroomDto {
  @ApiPropertyOptional({ description: 'Trạng thái đã xóa' })
  @IsOptional()
  isDeleted?: boolean;
}
