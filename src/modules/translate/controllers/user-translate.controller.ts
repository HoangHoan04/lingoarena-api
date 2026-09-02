import { Body, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DefController, DefPost } from '~/common/core/decorator';
import { JwtOptionalGuard } from '~/common/guards';
import { TranslateDto } from '../dto';
import { TranslateService } from '../service/translate.service';

@ApiTags('User - Translate')
@DefController('translate')
export class UserTranslateController {
  constructor(private readonly service: TranslateService) {}

  @UseGuards(JwtOptionalGuard)
  @DefPost()
  @ApiOperation({ summary: 'Dịch văn bản (Azure / Google / MyMemory)' })
  translate(@Body() dto: TranslateDto) {
    return this.service.translate(dto);
  }
}
