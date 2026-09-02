import { UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefController } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { SupportService } from '../service/support.service';

@ApiBearerAuth()
@ApiTags('Admin - Support')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('support')
export class AdminSupportController {
  constructor(private readonly service: SupportService) {}
}
