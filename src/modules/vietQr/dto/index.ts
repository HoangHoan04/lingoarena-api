export class TransactionCreateDto {
  amount: number;
  description: string;
  objectType: string;
  objectId: string;
  customerId: string;
  objectCode?: string;
  isTournament?: boolean;
  isMobile?: boolean;
  bankAccount: string;
}

import { IsOptional } from 'class-validator';

export class ReceiveTransactionDto {
  @IsOptional()
  bankaccount: string;
  @IsOptional()
  amount: number;
  @IsOptional()
  transType: string;
  @IsOptional()
  content: string;
  @IsOptional()
  transactionid: string;
  @IsOptional()
  transactiontime: string;
  @IsOptional()
  referencenumber: string;
  @IsOptional()
  orderId: string;
  @IsOptional()
  terminalCode?: string;
  @IsOptional()
  subTerminalCode?: string;
  @IsOptional()
  serviceCode?: string;
  @IsOptional()
  urlLink?: string;
  @IsOptional()
  sign?: string;
}

export class FilterOneVietQrDto {
  @IsOptional()
  id?: string;
}

export interface VietQrResponse {
  status: number;
  statusText: string;
  data: VietQrResponseData;
}

export interface VietQrResponseData {
  bankCode: string;
  bankName: string;
  bankAccount: string;
  userBankName: string;
  amount: string;
  content: string;
  qrCode: string;
  imgId: string;
  existing: number;
  transactionId: string;
  transactionRefId: string;
  qrLink: string;
  terminalCode: string;
  subTerminalCode: string;
  serviceCode: string;
  orderId: string;
  additionalData: any[];
  vaAccount: string;
}
