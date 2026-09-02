import { UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefController } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { GamificationService } from '../service/gamification.service';

@ApiBearerAuth()
@ApiTags('Admin - Gamification')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('gamification')
export class AdminGamificationController {
  constructor(private readonly service: GamificationService) {}
}
