import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard, JwtOptionalGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { CreateCourseReviewDto, EnrollCourseDto, FilterCourseDto, UpdateLessonProgressDto } from '../dto';
import { CourseService } from '../service/course.service';

@ApiTags('User - Course')
@DefController('course')
export class UserCourseController {
  constructor(private readonly service: CourseService) {}

  @UseGuards(JwtOptionalGuard)
  @DefPost('pagination')
  @ApiOperation({ summary: 'Danh sách khóa học công khai' })
  pagination(@Body() body: PaginationDto<FilterCourseDto>) {
    return this.service.publicPagination(body);
  }

  @UseGuards(JwtOptionalGuard)
  @DefGet('by-slug/:slug')
  @ApiOperation({ summary: 'Chi tiết khóa học theo slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost('enroll/:id')
  @ApiOperation({ summary: 'Ghi danh khóa học miễn phí' })
  enrollById(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.enroll(user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost('enroll')
  @ApiOperation({ summary: 'Ghi danh khóa học miễn phí' })
  enroll(@Body() dto: EnrollCourseDto, @CurrentUser() user: UserDto) {
    return this.service.enroll(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefGet('me/enrollments')
  @ApiOperation({ summary: 'Danh sách khóa học đã ghi danh' })
  myEnrollments(@CurrentUser() user: UserDto) {
    return this.service.myEnrollments(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefGet('lessons/:id')
  @ApiOperation({ summary: 'Chi tiết bài học' })
  lesson(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.userLesson(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost('lessons/:id/progress')
  @ApiOperation({ summary: 'Cập nhật tiến độ bài học' })
  progress(
    @Param('id') id: string,
    @Body() dto: UpdateLessonProgressDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.updateProgress(id, user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @DefPost(':id/reviews')
  @ApiOperation({ summary: 'Đánh giá khóa học' })
  createReview(
    @Param('id') id: string,
    @Body() dto: CreateCourseReviewDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.createReview(id, dto, user);
  }
}
