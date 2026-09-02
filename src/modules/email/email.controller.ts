import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmailService } from './email.service';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly service: EmailService) {}

  @ApiOperation({ summary: 'Gửi email xác thực đăng ký tài khoản' })
  @Post('send-verify-email')
  public async sendVerify(@Body() data: { email: string; otpCode: string }) {
    return await this.service.sendEmailVerify(data);
  }

  @ApiOperation({ summary: 'Gửi email reminder' })
  @Post('send-reminder-payment')
  public async sendReminderEmail(@Body() data: any) {
    return await this.service.sendReminderPaymentBeforeTournament3Days(data);
  }

  @ApiOperation({ summary: 'Gửi email reminder' })
  @Post('send-reminder-processing')
  public async sendReminderProcessing(@Body() data: any) {
    return await this.service.sendReminderProcessing(data);
  }

  @ApiOperation({ summary: 'Gửi email reminder' })
  @Post('test-send-mail')
  public async testSendMail() {
    return await this.service.testSendMail();
  }
}
