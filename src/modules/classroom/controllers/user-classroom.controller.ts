import { ApiTags } from '@nestjs/swagger';
import { DefController } from '~/common/core/decorator';
import { ClassroomService } from '../service/classroom.service';

@ApiTags('User - Classroom')
@DefController('classroom')
export class UserClassroomController {
  constructor(private readonly service: ClassroomService) {}
}
