import { UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, DefController, DefGet } from '~/common/core/decorator';
import { JwtAuthGuard } from '~/common/guards';
import { UserDto } from '~/dto';
import { OrganizationService } from '../service/organization.service';

@ApiBearerAuth()
@ApiTags('User - Organization')
@UseGuards(JwtAuthGuard)
@DefController('organization')
export class UserOrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @DefGet('me/organizations')
  @ApiOperation({ summary: 'Tổ chức của tôi' })
  myOrganizations(@CurrentUser() user: UserDto) {
    return this.service.myOrganizations(user);
  }
}
