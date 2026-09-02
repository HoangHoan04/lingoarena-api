import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ArchivalFile {
  @ApiProperty({ description: 'uid' })
  @IsNotEmpty()
  uid: string;

  @ApiProperty({ description: 'url' })
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ description: 'code' })
  fileCode?: string;

  @ApiProperty({ description: 'name' })
  fileName?: string;

  @ApiProperty({ description: 'data type' })
  dataType?: string;
}
