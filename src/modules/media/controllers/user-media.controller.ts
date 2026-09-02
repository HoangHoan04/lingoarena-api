import { Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DefController, DefGet } from '~/common/core/decorator';
import { JwtOptionalGuard } from '~/common/guards';
import { MediaService } from '../service/media.service';

@ApiTags('User - Media')
@DefController('media')
export class UserMediaController {
  constructor(private readonly service: MediaService) {}

  @UseGuards(JwtOptionalGuard)
  @DefGet('assets/:id')
  @ApiOperation({ summary: 'Chi tiết media asset công khai' })
  findPublicAsset(@Param('id') id: string) {
    return this.service.findAsset(id, true);
  }
}
