import { ApiTags } from '@nestjs/swagger';
import { DefController } from '~/common/core/decorator';
import { SupportService } from '../service/support.service';

@ApiTags('User - Support')
@DefController('support')
export class UserSupportController {
  constructor(private readonly service: SupportService) {}
}
