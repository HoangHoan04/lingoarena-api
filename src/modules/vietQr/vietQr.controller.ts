import { Body, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request as IRequest } from 'express';
import { DefController, DefPost } from '~/common/core/decorator';
import { FilterOneVietQrDto, ReceiveTransactionDto } from './dto';
import { VietQrService } from './vietQr.service';

@ApiBearerAuth()
@ApiTags('Viet Qr')
@DefController('vietqr')
export class VietQrController {
  constructor(private readonly service: VietQrService) {}

  @ApiOperation({ summary: 'Get token' })
  @DefPost('api/token_generate')
  async createTokenVietQr(@Req() req: IRequest) {}

  @ApiOperation({ summary: 'Get token test' })
  @DefPost('api/token_generate_test')
  async createTokenVietQrTest() {}

  @ApiOperation({ summary: 'Transaction sync' })
  @DefPost('bank/api/transaction-sync')
  async webhookReceiveTransaction(@Req() req: IRequest, @Body() data: ReceiveTransactionDto) {}

  @ApiOperation({ summary: 'Transaction sync test' })
  @DefPost('bank/api/test/transaction-callback')
  async webhookReceiveTransaction2(@Req() req: IRequest, @Body() data: ReceiveTransactionDto) {}
  @DefPost('simulator-callback')
  async simulatorReceiveTransaction(@Body() data: ReceiveTransactionDto) {}

  @ApiOperation({ summary: 'Gen base 64' })
  @DefPost('gen_base64')
  async genBase64(@Body() data: FilterOneVietQrDto) {}

  @ApiOperation({ summary: 'Lấy token truy cập vietqr' })
  @DefPost('api/get_token_vietqr')
  async getTokenVietQr() {}
}
