import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubscribeDTO {
  @ApiProperty({ description: 'FCM Token của thiết bị' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Tên thiết bị' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Model thiệt bị' })
  @IsString()
  @IsOptional()
  model?: string;
}
