import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser, DefController, DefGet, DefPatch, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import {
  CreateAssignmentDto,
  CreateClassroomDto,
  CreateClassroomMemberDto,
  FilterClassroomDto,
  UpdateClassroomDto,
} from '../dto';
import { ClassroomService } from '../service/classroom.service';

@ApiBearerAuth()
@ApiTags('Admin - Classroom')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('classroom')
export class AdminClassroomController {
  constructor(private readonly service: ClassroomService) {}

  @DefPost('pagination')
  @ApiOperation({ summary: 'Phân trang lớp học' })
  pagination(@Body() body: PaginationDto<FilterClassroomDto>) {
    return this.service.pagination(body);
  }

  @DefPost()
  @ApiOperation({ summary: 'Tạo lớp học' })
  create(@Body() dto: CreateClassroomDto, @CurrentUser() user: UserDto) {
    return this.service.create(dto, user);
  }

  @SkipThrottle()
  @DefPost('import')
  @ApiOperation({ summary: 'Nhập Excel lớp học' })
  importClassrooms(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importClassrooms(dto, user);
  }

  @DefPost('export-excel')
  @ApiOperation({ summary: 'Xuất Excel lớp học' })
  exportClassrooms(@Body() body: PaginationDto<FilterClassroomDto>) {
    return this.service.exportClassrooms(body);
  }

  @DefGet(':id/members')
  @ApiOperation({ summary: 'Thành viên lớp' })
  listMembers(@Param('id') id: string) {
    return this.service.listMembers(id);
  }

  @DefPost('members')
  @ApiOperation({ summary: 'Thêm thành viên lớp' })
  addMember(@Body() dto: CreateClassroomMemberDto, @CurrentUser() user: UserDto) {
    return this.service.addMember(dto, user);
  }

  @DefGet(':id/assignments')
  @ApiOperation({ summary: 'Bài tập của lớp' })
  listAssignments(@Param('id') id: string) {
    return this.service.listAssignments(id);
  }

  @DefPost('assignments')
  @ApiOperation({ summary: 'Giao bài tập' })
  createAssignment(@Body() dto: CreateAssignmentDto, @CurrentUser() user: UserDto) {
    return this.service.createAssignment(dto, user);
  }

  @DefGet(':id')
  @ApiOperation({ summary: 'Chi tiết lớp học' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @DefPatch(':id')
  @ApiOperation({ summary: 'Cập nhật lớp học' })
  update(@Param('id') id: string, @Body() dto: UpdateClassroomDto, @CurrentUser() user: UserDto) {
    return this.service.update(id, dto, user);
  }

  @DefPut('deactivate/:id')
  @ApiOperation({ summary: 'Ngưng lớp học' })
  deactivate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivate(id, user);
  }

  @DefPut('activate/:id')
  @ApiOperation({ summary: 'Kích hoạt lớp học' })
  activate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activate(id, user);
  }
}
