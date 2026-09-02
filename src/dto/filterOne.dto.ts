import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class FilterOneDto {
  @ApiProperty({
    description: 'Id của đối tượng',
  })
  @IsUUID()
  @IsOptional()
  id?: string;
}

export class IdDto {
  @ApiProperty({ description: 'Id của đối tượng' })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  id: string;
}
