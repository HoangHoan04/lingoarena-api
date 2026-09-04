import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser, DefController, DefGet, DefPatch, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { CreateOrganizationDto, CreateOrganizationMemberDto, FilterOrganizationDto, UpdateOrganizationDto } from '../dto';
import { OrganizationService } from '../service/organization.service';

@ApiBearerAuth()
@ApiTags('Admin - Organization')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('organization')
export class AdminOrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @DefPost('pagination')
  @ApiOperation({ summary: 'Phân trang tổ chức' })
  pagination(@Body() body: PaginationDto<FilterOrganizationDto>) {
    return this.service.pagination(body);
  }

  @DefPost()
  @ApiOperation({ summary: 'Tạo tổ chức' })
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: UserDto) {
    return this.service.create(dto, user);
  }

  @SkipThrottle()
  @DefPost('import')
  @ApiOperation({ summary: 'Nhập Excel tổ chức' })
  importOrganizations(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importOrganizations(dto, user);
  }

  @DefPost('export-excel')
  @ApiOperation({ summary: 'Xuất Excel tổ chức' })
  exportOrganizations(@Body() body: PaginationDto<FilterOrganizationDto>) {
    return this.service.exportOrganizations(body);
  }

  @DefGet(':id/members')
  @ApiOperation({ summary: 'Thành viên tổ chức' })
  listMembers(@Param('id') id: string) {
    return this.service.listMembers(id);
  }

  @DefPost('members')
  @ApiOperation({ summary: 'Thêm thành viên tổ chức' })
  addMember(@Body() dto: CreateOrganizationMemberDto, @CurrentUser() user: UserDto) {
    return this.service.addMember(dto, user);
  }

  @DefGet(':id')
  @ApiOperation({ summary: 'Chi tiết tổ chức' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @DefPatch(':id')
  @ApiOperation({ summary: 'Cập nhật tổ chức' })
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto, @CurrentUser() user: UserDto) {
    return this.service.update(id, dto, user);
  }

  @DefPut('deactivate/:id')
  @ApiOperation({ summary: 'Ngưng tổ chức' })
  deactivate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivate(id, user);
  }

  @DefPut('activate/:id')
  @ApiOperation({ summary: 'Kích hoạt tổ chức' })
  activate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activate(id, user);
  }
}
