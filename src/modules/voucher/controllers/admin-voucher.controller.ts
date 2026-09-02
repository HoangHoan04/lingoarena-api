import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  DefController,
  DefGet,
  DefPatch,
  DefPost,
  DefPut,
} from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import {
  AssignVoucherCustomersDto,
  CreateVoucherDto,
  FilterVoucherDto,
  UpdateVoucherDto,
} from '../dto';
import { VoucherService } from '../voucher.service';

@ApiBearerAuth()
@ApiTags('Admin - Vouchers')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('vouchers')
export class AdminVoucherController {
  constructor(private readonly service: VoucherService) {}

  @DefPost()
  @ApiOperation({ summary: 'Tạo mới voucher' })
  async create(@Body() dto: CreateVoucherDto, @CurrentUser() user: UserDto) {
    return await this.service.create(dto, user);
  }

  @DefPost('pagination')
  async pagination(@Body() body: PaginationDto<FilterVoucherDto>) {
    return await this.service.pagination(body);
  }

  @DefGet('select-box')
  async selectBox() {
    return await this.service.selectBox();
  }

  @DefGet(':id')
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @DefPatch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVoucherDto,
    @CurrentUser() user: UserDto,
  ) {
    return await this.service.update(user, id, dto);
  }

  @DefPut('deactivate/:id')
  async deactivate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return await this.service.deactivate(user, id);
  }

  @DefPut('activate/:id')
  async activate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return await this.service.activate(user, id);
  }

  @DefPost('customers/:id')
  @ApiOperation({ summary: 'Gán khách hàng whitelist voucher' })
  async addCustomers(
    @Param('id') id: string,
    @Body() dto: AssignVoucherCustomersDto,
    @CurrentUser() user: UserDto,
  ) {
    return await this.service.addCustomers(user, id, dto);
  }

  @DefPut('deactivate-customers/:id/:customerId')
  @ApiOperation({ summary: 'Gỡ khách khỏi whitelist voucher' })
  async deactivateCustomer(
    @Param('id') id: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: UserDto,
  ) {
    return await this.service.deactivateCustomer(user, id, customerId);
  }

  @DefPost('export-excel')
  async exportExcel() {
    return await this.service.exportToExcel();
  }
}
