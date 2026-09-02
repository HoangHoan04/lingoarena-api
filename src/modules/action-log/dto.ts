import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class ActionLogFilterDto {
  @ApiProperty({
    description: 'Id của entity lưu lịch sử',
    required: true,
  })
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({
    description: 'Thực hiện thao tác trên loại entity nào',
    required: true,
  })
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({
    description: 'Loại thao tác',
    required: true,
  })
  @IsOptional()
  actionType: string;

  @ApiProperty({
    description: 'Mã người tạo',
    required: true,
  })
  @IsOptional()
  actorCode: string;

  @ApiProperty({
    description: 'Tên người tạo',
    required: true,
  })
  @IsOptional()
  actorName: string;
}

export class ActionLogCreateDto {
  @ApiProperty({
    description: 'Id của entity lưu lịch sử',
    required: true,
  })
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({
    description: 'Thực hiện thao tác trên loại entity nào',
    required: true,
  })
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({
    description: 'Loại thao tác',
    required: true,
  })
  @IsNotEmpty()
  actionType: string;

  @ApiProperty({
    description: 'Tên người tạo',
    required: true,
  })
  @IsNotEmpty()
  createdBy: string;

  @ApiProperty({
    description: 'Mã người tạo',
  })
  @IsOptional()
  actorCode?: string;

  @ApiProperty({
    description: 'Tên người tạo',
    required: true,
  })
  @IsNotEmpty()
  actorName: string;

  @ApiProperty({
    description: 'Nội dung',
    required: true,
  })
  @IsNotEmpty()
  dataBefore?: string;

  @ApiProperty({
    description: 'Nội dung mới',
    required: true,
  })
  @IsNotEmpty()
  dataAfter?: string;

  @ApiProperty({
    description: 'Mô tả',
    required: true,
  })
  @IsNotEmpty()
  description: string;
}
