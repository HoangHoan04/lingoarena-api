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
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { SuccessResponse } from '~/common/helpers/page.helper';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { AssignUserRoleDto, CreateRoleDto, FilterRoleDto, UpdateRoleDto } from '../dto';
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

  @SkipThrottle()
  @DefPost('import')
  @ApiOperation({ summary: 'Nhập Excel vai trò' })
  importRoles(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importRoles(dto, user);
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
  async exportExcel(@Body() body: PaginationDto<FilterRoleDto>) {
    return await this.service.exportToExcel(body);
  }

  @DefPost('assign-user')
  @ApiOperation({ summary: 'Gán vai trò cho người dùng' })
  assignUserRole(@Body() dto: AssignUserRoleDto, @CurrentUser() user: UserDto) {
    return this.service.assignUserRole(dto, user);
  }
}
