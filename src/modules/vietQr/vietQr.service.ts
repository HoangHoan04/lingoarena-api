import { Injectable } from '@nestjs/common';
import { Request as IRequest } from 'express';
import { DefTransaction } from '~/common/core/decorator';
import { FilterOneDto, UserDto } from '~/dto';
import { ReceiveTransactionDto, TransactionCreateDto } from './dto';

@Injectable()
export class VietQrService {
  constructor() {}

  /** Tạo token cho phép VietQr truy cập */
  async createTokenVietQr(req: IRequest): Promise<any> {}

  /** Tạo token cho phép VietQr truy cập test */
  async createTokenVietQrTest(): Promise<any> {}

  async genBase64(data: FilterOneDto) {
    return Buffer.from(data.id).toString('base64');
  }

  /** webhook nhận thông tin giao dịch */
  async webhookReceiveTransaction(req: IRequest, data: ReceiveTransactionDto) {}

  /** Giả lập nhận thông tin giao dịch */
  async simulatorReceiveTransaction(data: ReceiveTransactionDto) {}

  validateToken(token) {}

  /** Tạo giao dịch */
  @DefTransaction()
  async createTransaction(user: UserDto, data: TransactionCreateDto) {}

  /** Tạo giao dịch */
  @DefTransaction()
  async createTransactionRaw(data: TransactionCreateDto) {}

  /** Lấy token để truy cập vào Vietqr */
  async getTokenVietQr() {}

  /** Tính toán thời gian hết hạn thanh toán */
  private getPaymentExpireDate(objectType: string, bookingType?: string) {}

  private getInfoByBankAccount(bankAccount: string) {}

  @DefTransaction()
  private async genCode() {}
}
