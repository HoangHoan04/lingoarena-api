import { UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefController } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { ClassroomService } from '../service/classroom.service';

@ApiBearerAuth()
@ApiTags('Admin - Classroom')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('classroom')
export class AdminClassroomController {
  constructor(private readonly service: ClassroomService) {}
}
