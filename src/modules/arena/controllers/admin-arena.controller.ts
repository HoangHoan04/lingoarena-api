import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet, DefPost } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { PaginationDto, UserDto } from '~/dto';
import { FilterArenaDto } from '../dto';
import { ArenaService } from '../service/arena.service';

@ApiBearerAuth()
@ApiTags('Admin - Arena')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('arena')
export class AdminArenaController {
  constructor(private readonly service: ArenaService) {}

  @DefPost('matches/pagination')
  @ApiOperation({ summary: 'Danh sách trận Arena' })
  paginationMatches(@Body() body: PaginationDto<FilterArenaDto>) {
    return this.service.paginationMatches(body);
  }

  @DefGet('matches/:id')
  @ApiOperation({ summary: 'Chi tiết trận Arena' })
  findMatch(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.adminFindMatch(id, user);
  }
}
