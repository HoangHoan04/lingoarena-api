import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard } from '~/common/guards';
import { UserDto } from '~/dto';
import { JoinClassroomDto, SubmitAssignmentDto } from '../dto';
import { ClassroomService } from '../service/classroom.service';

@ApiBearerAuth()
@ApiTags('User - Classroom')
@UseGuards(JwtAuthGuard)
@DefController('classroom')
export class UserClassroomController {
  constructor(private readonly service: ClassroomService) {}

  @DefGet('me/classes')
  @ApiOperation({ summary: 'Lớp học của tôi' })
  myClasses(@CurrentUser() user: UserDto) {
    return this.service.myClasses(user);
  }

  @DefPost('join')
  @ApiOperation({ summary: 'Tham gia lớp bằng mã' })
  join(@Body() dto: JoinClassroomDto, @CurrentUser() user: UserDto) {
    return this.service.join(dto, user);
  }

  @DefPost('assignments/:id/submit')
  @ApiOperation({ summary: 'Nộp bài tập' })
  submitAssignment(
    @Param('id') id: string,
    @Body() dto: SubmitAssignmentDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.service.submitAssignment(id, dto, user);
  }

  @DefGet(':id')
  @ApiOperation({ summary: 'Chi tiết lớp học' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.userFindOne(id, user);
  }
}
