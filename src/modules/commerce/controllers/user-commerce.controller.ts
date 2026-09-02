import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard, JwtOptionalGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { CreateOrderDto, FilterCommerceDto } from '../dto';
import { CommerceService } from '../service/commerce.service';

@ApiBearerAuth()
@ApiTags('User - Commerce')
@DefController('commerce')
export class UserCommerceController {
  constructor(private readonly service: CommerceService) {}

  @UseGuards(JwtOptionalGuard)
  @DefPost('products/pagination')
  @ApiOperation({ summary: 'Catalog sản phẩm đang bán' })
  paginationProducts(@Body() body: PaginationDto<FilterCommerceDto>) {
    return this.service.paginationProducts(body, true);
  }

  @UseGuards(JwtAuthGuard)
  @DefPost('orders')
  @ApiOperation({ summary: 'Tạo đơn hàng' })
  createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: UserDto) {
    return this.service.createOrder(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @DefPost('orders/:id/pay-sandbox')
  @ApiOperation({ summary: 'Thanh toán sandbox' })
  paySandbox(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.paySandbox(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @DefGet('me/orders')
  @ApiOperation({ summary: 'Đơn hàng của tôi' })
  getMyOrders(@CurrentUser() user: UserDto) {
    return this.service.getMyOrders(user);
  }

  @UseGuards(JwtAuthGuard)
  @DefGet('me/entitlements')
  @ApiOperation({ summary: 'Quyền lợi của tôi' })
  getMyEntitlements(@CurrentUser() user: UserDto) {
    return this.service.getMyEntitlements(user);
  }
}
