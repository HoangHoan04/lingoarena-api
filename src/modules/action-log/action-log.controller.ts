import { Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DefController, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { PaginationDto } from '~/dto';
import { ActionLogService } from './action-log.service';
import { ActionLogFilterDto } from './dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('ActionLog')
@DefController('action-log')
export class AdminActionLogController {
  constructor(private readonly service: ActionLogService) {}

  @ApiOperation({ summary: 'Hàm phân trang' })
  @DefPost('pagination')
  public async pagination(@Body() data: PaginationDto<ActionLogFilterDto>) {
    return this.service.pagination(data);
  }
}
