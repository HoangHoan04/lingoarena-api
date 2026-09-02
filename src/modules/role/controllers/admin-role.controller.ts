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
import { SuccessResponse } from '~/common/helpers/page.helper';
import { PaginationDto, UserDto } from '~/dto';
import { CreateRoleDto, FilterRoleDto, UpdateRoleDto } from '../dto';
import { RoleService } from '../role.service';

@ApiBearerAuth()
@ApiTags('Admin - Roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('roles')
export class AdminRoleController {
  constructor(private readonly service: RoleService) {}

  @DefPost()
  @ApiOperation({ summary: 'Tạo mới vai trò' })
  async create(@Body() dto: CreateRoleDto, @CurrentUser() user: UserDto): Promise<SuccessResponse> {
    return await this.service.create(dto, user);
  }

  @DefPost('pagination')
  async pagination(@Body() body: PaginationDto<FilterRoleDto>) {
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
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @CurrentUser() user: UserDto) {
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

  @DefPost('export-excel')
  async exportExcel() {
    return await this.service.exportToExcel();
  }
}
