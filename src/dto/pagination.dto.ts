import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto<T = any> {
  @ApiProperty({ description: 'Điều kiện lọc' })
  where?: T;
  @ApiProperty({ description: 'Số record bỏ qua' })
  skip: number;
  @ApiProperty({ description: 'Số record lấy' })
  take: number;
  @ApiProperty({ description: 'Sắp xếp' })
  order?: any;
}
