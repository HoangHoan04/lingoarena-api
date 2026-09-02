import { Injectable } from '@nestjs/common';
import { DefTransaction } from '~/common/core/decorator';
import { PaginationDto, UserDto } from '~/dto';
import {
  AssignVoucherCustomersDto,
  CreateVoucherDto,
  FilterVoucherDto,
  UpdateVoucherDto,
} from './dto';

@Injectable()
export class VoucherService {
  constructor() {}

  private async assertUniqueCode(code: string, excludeId?: string) {}

  async findOne(id: string) {}

  async selectBox() {}

  async pagination(body: PaginationDto<FilterVoucherDto>) {}

  @DefTransaction()
  async create(dto: CreateVoucherDto, user: UserDto) {}

  @DefTransaction()
  async update(user: UserDto, id: string, dto: UpdateVoucherDto) {}

  @DefTransaction()
  async deactivate(user: UserDto, id: string) {}

  @DefTransaction()
  async activate(user: UserDto, id: string) {}

  @DefTransaction()
  async addCustomers(user: UserDto, id: string, dto: AssignVoucherCustomersDto) {}

  @DefTransaction()
  async deactivateCustomer(user: UserDto, id: string, customerId: string) {}

  async exportToExcel(_filter?: PaginationDto<FilterVoucherDto>) {}

  private async insertCustomers(voucherId: string, customerIds: string[], userId: string) {}
}
