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
  async createTokenVietQr(@Req() req: IRequest) {
    return await this.service.createTokenVietQr(req);
  }

  @ApiOperation({ summary: 'Get token test' })
  @DefPost('api/token_generate_test')
  async createTokenVietQrTest() {
    return await this.service.createTokenVietQrTest();
  }

  @ApiOperation({ summary: 'Transaction sync' })
  @DefPost('bank/api/transaction-sync')
  async webhookReceiveTransaction(@Req() req: IRequest, @Body() data: ReceiveTransactionDto) {
    return await this.service.webhookReceiveTransaction(req, data);
  }

  @ApiOperation({ summary: 'Transaction sync test' })
  @DefPost('bank/api/test/transaction-callback')
  async webhookReceiveTransaction2(@Req() req: IRequest, @Body() data: ReceiveTransactionDto) {
    return await this.service.webhookReceiveTransaction(req, data);
  }
  @DefPost('simulator-callback')
  async simulatorReceiveTransaction(@Body() data: ReceiveTransactionDto) {
    return await this.service.simulatorReceiveTransaction(data);
  }

  @ApiOperation({ summary: 'Gen base 64' })
  @DefPost('gen_base64')
  async genBase64(@Body() data: FilterOneVietQrDto) {
    return await this.service.genBase64(data);
  }

  @ApiOperation({ summary: 'Lấy token truy cập vietqr' })
  @DefPost('api/get_token_vietqr')
  async getTokenVietQr() {
    return await this.service.getTokenVietQr();
  }
}
