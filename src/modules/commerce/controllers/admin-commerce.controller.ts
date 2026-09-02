import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { CreateProductDto, FilterCommerceDto, UpdateProductDto } from '../dto';
import { CommerceService } from '../service/commerce.service';

@ApiBearerAuth()
@ApiTags('Admin - Commerce')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('commerce')
export class AdminCommerceController {
  constructor(private readonly service: CommerceService) {}

  @DefPost('products/pagination')
  @ApiOperation({ summary: 'Danh sách sản phẩm' })
  paginationProducts(@Body() body: PaginationDto<FilterCommerceDto>) {
    return this.service.paginationProducts(body);
  }

  @DefGet('products/:id')
  @ApiOperation({ summary: 'Chi tiết sản phẩm' })
  findProduct(@Param('id') id: string) {
    return this.service.findProduct(id);
  }

  @DefPost('products')
  @ApiOperation({ summary: 'Tạo sản phẩm' })
  createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: UserDto) {
    return this.service.createProduct(dto, user);
  }

  @DefPut('products/:id')
  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: UserDto) {
    return this.service.updateProduct(id, dto, user);
  }

  @DefPut('products/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng sản phẩm' })
  deactivateProduct(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateProduct(id, user);
  }

  @DefPut('products/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt sản phẩm' })
  activateProduct(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateProduct(id, user);
  }

  @DefPost('orders/pagination')
  @ApiOperation({ summary: 'Danh sách đơn hàng' })
  paginationOrders(@Body() body: PaginationDto<FilterCommerceDto>) {
    return this.service.paginationOrders(body);
  }

  @DefGet('orders/:id')
  @ApiOperation({ summary: 'Chi tiết đơn hàng' })
  findOrder(@Param('id') id: string) {
    return this.service.findOrder(id);
  }
}
