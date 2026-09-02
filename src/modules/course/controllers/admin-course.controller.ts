import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPatch, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import {
  CreateCourseDto,
  CreateCourseSectionDto,
  CreateCourseVersionDto,
  CreateLessonBlockDto,
  CreateLessonDto,
  FilterCourseDto,
  UpdateCourseDto,
  UpdateCourseSectionDto,
  UpdateLessonBlockDto,
  UpdateLessonDto,
} from '../dto';
import { CourseService } from '../service/course.service';

@ApiBearerAuth()
@ApiTags('Admin - Course')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('course')
export class AdminCourseController {
  constructor(private readonly service: CourseService) {}

  @DefPost('pagination')
  @ApiOperation({ summary: 'Phân trang khóa học' })
  pagination(@Body() body: PaginationDto<FilterCourseDto>) {
    return this.service.pagination(body);
  }

  @DefPost()
  @ApiOperation({ summary: 'Tạo khóa học' })
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: UserDto) {
    return this.service.create(dto, user);
  }

  @DefGet(':id')
  @ApiOperation({ summary: 'Chi tiết khóa học' })
  find(@Param('id') id: string) {
    return this.service.find(id);
  }

  @DefPatch(':id')
  @ApiOperation({ summary: 'Cập nhật khóa học' })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @CurrentUser() user: UserDto) {
    return this.service.update(id, dto, user);
  }

  @DefPut('publish/:id')
  @ApiOperation({ summary: 'Xuất bản khóa học' })
  publish(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.publish(id, user);
  }

  @DefPut('deactivate/:id')
  @ApiOperation({ summary: 'Ngưng khóa học' })
  deactivate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivate(id, user);
  }

  @DefPut('activate/:id')
  @ApiOperation({ summary: 'Kích hoạt khóa học' })
  activate(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activate(id, user);
  }

  @DefPost('versions')
  @ApiOperation({ summary: 'Tạo phiên bản khóa học' })
  createVersion(@Body() dto: CreateCourseVersionDto, @CurrentUser() user: UserDto) {
    return this.service.createVersion(dto, user);
  }

  @DefPut('versions/:id/publish')
  @ApiOperation({ summary: 'Xuất bản phiên bản khóa học' })
  publishVersion(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.publishVersion(id, user);
  }

  @DefPost('sections')
  @ApiOperation({ summary: 'Tạo chương khóa học' })
  createSection(@Body() dto: CreateCourseSectionDto, @CurrentUser() user: UserDto) {
    return this.service.createSection(dto, user);
  }

  @DefPatch('sections/:id')
  @ApiOperation({ summary: 'Cập nhật chương khóa học' })
  updateSection(@Param('id') id: string, @Body() dto: UpdateCourseSectionDto, @CurrentUser() user: UserDto) {
    return this.service.updateSection(id, dto, user);
  }

  @DefPut('sections/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng chương khóa học' })
  deactivateSection(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateSection(id, user);
  }

  @DefPost('lessons')
  @ApiOperation({ summary: 'Tạo bài học' })
  createLesson(@Body() dto: CreateLessonDto, @CurrentUser() user: UserDto) {
    return this.service.createLesson(dto, user);
  }

  @DefPatch('lessons/:id')
  @ApiOperation({ summary: 'Cập nhật bài học' })
  updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto, @CurrentUser() user: UserDto) {
    return this.service.updateLesson(id, dto, user);
  }

  @DefPut('lessons/:id/publish')
  @ApiOperation({ summary: 'Xuất bản bài học' })
  publishLesson(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.publishLesson(id, user);
  }

  @DefPost('blocks')
  @ApiOperation({ summary: 'Tạo block bài học' })
  createBlock(@Body() dto: CreateLessonBlockDto, @CurrentUser() user: UserDto) {
    return this.service.createBlock(dto, user);
  }

  @DefPatch('blocks/:id')
  @ApiOperation({ summary: 'Cập nhật block bài học' })
  updateBlock(@Param('id') id: string, @Body() dto: UpdateLessonBlockDto, @CurrentUser() user: UserDto) {
    return this.service.updateBlock(id, dto, user);
  }

  @DefPut('blocks/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng block bài học' })
  deactivateBlock(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateBlock(id, user);
  }
}
