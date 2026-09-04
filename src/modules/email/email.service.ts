import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';
import { EmailQueueService } from './email-queue.service';

dotenv.config();

@Injectable()
export class EmailService {
  private smtpEndpoint: string;
  private port: number;
  private senderAddress: string;
  private senderPassword: string;
  private transporter: nodemailer.Transporter;

  constructor(private readonly emailQueue: EmailQueueService) {
    this.smtpEndpoint = 'smtp.gmail.com';
    this.port = 587;
    this.senderAddress = process.env.EMAIL_VALIDATE_ACCOUNT || '';
    this.senderPassword = process.env.EMAIL_VALIDATE_PASSWORD || '';

    this.transporter = nodemailer.createTransport({
      host: this.smtpEndpoint,
      port: this.port,
      secure: false,
      auth: {
        user: this.senderAddress,
        pass: this.senderPassword,
      },
    });
  }

  private async sendMailQueued(mailOptions: nodemailer.SendMailOptions) {
    return this.emailQueue.add(() => this.transporter.sendMail(mailOptions));
  }

  /** Gửi email xác thực đăng ký tài khoản */
  public async sendEmailVerify(data: { email: string; otpCode: string }) {
    const mailOptions = {
      from: `"LingoArena" <${this.senderAddress}>`,
      to: data.email,
      subject: '[LingoArena] Mã xác thực đăng ký tài khoản',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2b417e; text-align: center;">Xác minh tài khoản LingoArena</h2>
          <p>Chào bạn,</p>
          <p>Mã OTP xác thực email <strong>${data.email}</strong>:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #2b417e; background: #f0f4fc; padding: 10px 20px; border-radius: 8px; border: 1px solid #cbd5e1;">${data.otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #64748b;">Mã OTP có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này.</p>
        </div>
      `,
    };
    try {
      await this.sendMailQueued(mailOptions);
    } catch (err) {
      console.warn('Could not send verify OTP email via SMTP:', err);
    }
    return true;
  }

  /** Gửi email mã OTP khôi phục mật khẩu */
  public async sendForgotPasswordOtp(data: { email: string; otpCode: string }) {
    const mailOptions = {
      from: `"LingoArena Support" <${this.senderAddress}>`,
      to: data.email,
      subject: '[LingoArena] Mã xác thực khôi phục mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2b417e; text-align: center;">Khôi phục mật khẩu LingoArena</h2>
          <p>Chào bạn,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${data.email}</strong>.</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #2b417e; background: #f0f4fc; padding: 10px 20px; border-radius: 8px; border: 1px solid #cbd5e1;">${data.otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #64748b;">Mã OTP có hiệu lực trong <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
        </div>
      `,
    };
    try {
      await this.sendMailQueued(mailOptions);
    } catch (err) {
      console.warn('Could not send OTP email via SMTP:', err);
    }
    return true;
  }

  /** Gửi email nhắc nhở thanh toán trước ngày thi đấu (3 ngày) */
  async sendReminderPaymentBeforeTournament3Days(data: {
    email: string;
    athleteName?: string;
    athleteNameEn?: string;
    tournamentName: string;
    tournamentNameEn?: string;
    categories: string[];
    categoriesEn?: string[];
    amount: number;
    payUrl?: string;
    payHistoryUrl?: string;
    startDate?: Date;
    bannerUrl?: string;
    fanpageUrl?: string;
    websiteUrl?: string;
    zaloUrl?: string;
    contactPhone?: string;
    contactEmail?: string;
  }) {
    const themeBlue = '#0b3d91';
    const lightBg = '#f9fafb';

    const athleteNameVi = data.athleteName?.trim();
    const athleteNameEn = data.athleteNameEn?.trim() || data.athleteName?.trim();
    const tournamentNameEn = data.tournamentNameEn?.trim() || data.tournamentName;
    const categoriesVi = (data.categories || []).filter(Boolean);
    const categoriesEn = (data.categoriesEn || []).filter(Boolean);
    const payLink = data.payUrl || data.payHistoryUrl || '';

    const bannerBlock = data.bannerUrl
      ? `
      <div style="border-bottom:4px solid ${themeBlue};">
        <img src="${data.bannerUrl}" alt="banner" style="width:100%;max-width:720px;display:block;border:0;outline:none;" />
      </div>`
      : '';

    const listVi =
      categoriesVi.length > 0
        ? categoriesVi.map((c, idx) => `<li style="margin:4px 0;">${idx + 1}. ${c}</li>`).join('')
        : '<li style="margin:4px 0;">1.</li>';
    const listEn =
      categoriesEn.length > 0
        ? categoriesEn.map((c, idx) => `<li style="margin:4px 0;">${idx + 1}. ${c}</li>`).join('')
        : '<li style="margin:4px 0;">2.</li>';

    const payAnchorVi = payLink
      ? `<a href="${payLink}" target="_blank" style="color:#ffffff;text-decoration:underline;">Tại đây</a>`
      : 'Tại đây';
    const payAnchorEn = payLink
      ? `<a href="${payLink}" target="_blank" style="color:#ffffff;text-decoration:underline;">Here</a>`
      : 'Here';

    const contactPhone = '';
    const contactEmail = '';

    const htmlVi = ``;

    const htmlEn = ``;

    this.sendMailQueued({
      from: this.senderAddress,
      to: data.email,
      subject: `Thư xác nhận thông tin và bổ sung lệ phí Giải đấu ${data.tournamentName}`,
      html: `${htmlVi}<br/><hr/><br/>${htmlEn}`,
    });
    return true;
  }

  /** Gửi email hủy nội dung thi đấu & hoàn tiền đăng ký */
  async sendCancelRegisterContent(data: {
    email: string;
    athleteName?: string;
    athleteNameEn?: string;
    tournamentName?: string;
    tournamentNameEn?: string;
    categories?: string[];
    categoriesEn?: string[];
    bannerUrl?: string;
    contactPhone?: string;
    contactEmail?: string;
  }) {
    if (!data.email) return;

    const themeBlue = '#0b3d91';
    const borderGray = '#e5e7eb';
    const lightBg = '#f9fafb';
    const athleteNameVi = data.athleteName?.trim() || 'Tên VĐV';
    const athleteNameEn = data.athleteNameEn?.trim() || data.athleteName?.trim() || "Player's Name";
    const tournamentName = data.tournamentName || 'Giải đấu';
    const tournamentNameEn = data.tournamentNameEn || data.tournamentName || 'Tournament';

    const categoriesVi =
      data.categories && data.categories.length
        ? data.categories
        : ['Tên nội dung (ví dụ: Đơn Nam - Hạng A)'];
    const categoriesEn =
      data.categoriesEn && data.categoriesEn.length
        ? data.categoriesEn
        : ['Category name (e.g., Men’s Singles - Level A)'];

    const bannerBlock = data.bannerUrl
      ? `<div style="border-bottom:4px solid ${themeBlue};">
           <img src="${data.bannerUrl}" alt="banner" style="width:100%;max-width:720px;display:block;border:0;outline:none;" />
         </div>`
      : '';

    const contactPhone = data.contactPhone;
    const contactEmail = data.contactEmail;

    const viSection = ``;

    const enSection = ``;

    this.sendMailQueued({
      from: this.senderAddress,
      to: data.email,
      subject: `Thông báo hủy nội dung & hoàn tiền đăng ký - Giải ${tournamentName}`,
      html: `${viSection}<br/><hr/><br/>${enSection}`,
    });
  }

  /** Gửi email xác nhận hủy đăng ký cho admin */
  async sendCancelRegisterAdminAction(data: {
    email: string;
    athleteName?: string;
    athleteNameEn?: string;
    tournamentName?: string;
    tournamentNameEn?: string;
    categories?: string[];
    categoriesEn?: string[];
    bannerUrl?: string;
    contactPhone?: string;
    contactEmail?: string;
  }) {
    if (!data.email) return;

    const themeBlue = '#0b3d91';
    const lightBg = '#f9fafb';
    const athleteNameVi = data.athleteName?.trim() || 'Tên VĐV';
    const athleteNameEn = data.athleteNameEn?.trim() || data.athleteName?.trim() || "Player's Name";
    const tournamentName = data.tournamentName?.trim() || 'Giải đấu';
    const tournamentNameEn =
      data.tournamentNameEn?.trim() || data.tournamentName?.trim() || 'Tournament';

    const categoriesViFiltered = (data.categories || []).filter(Boolean);
    const categoriesEnFiltered = (data.categoriesEn || []).filter(Boolean);
    const categoriesLabelVi = categoriesViFiltered.length
      ? categoriesViFiltered.join(', ')
      : 'nội dung đăng ký của bạn';
    const categoriesLabelEn = categoriesEnFiltered.length
      ? categoriesEnFiltered.join(', ')
      : 'your registered event';

    const bannerBlock = data.bannerUrl
      ? `
        <div style="border-bottom:4px solid ${themeBlue};">
          <img src="${data.bannerUrl}" alt="banner" style="width:100%;max-width:720px;display:block;border:0;outline:none;" />
        </div>`
      : '';

    const contactPhone = data.contactPhone;
    const contactEmail = data.contactEmail;

    const viHtml = ``;

    const enHtml = ``;

    this.sendMailQueued({
      from: this.senderAddress,
      to: data.email,
      subject: `Thư xác nhận hủy nội dung thi đấu - Giải ${tournamentName}`,
      html: `${viHtml}<br/><hr/><br/>${enHtml}`,
    });
  }

  async testSendMail() {
    for (let i = 0; i <= 5; i++) {
      console.log(`i :`, i);
      await this.sendCancelRegisterPaid({
        email: '',
        athleteName: 'test',
        tournamentName: 'test',
        categories: ['test'],
        bannerUrl: 'test',
        contactPhone: 'test',
        contactEmail: 'test',
      });
    }
  }

  /** Gửi email xác nhận hủy đăng ký */
  async sendCancelRegisterPaid(data: {
    email: string;
    athleteName?: string;
    tournamentName?: string;
    categories?: string[];
    bannerUrl?: string;
    contactPhone?: string;
    contactEmail?: string;
  }) {
    if (!data.email) return;

    const themeBlue = '#0b3d91';
    const lightBg = '#f9fafb';
    const athleteName = data.athleteName?.trim() || 'Tên VĐV';
    const tournamentName = data.tournamentName || 'Giải đấu';
    const categories = (data.categories || []).filter(Boolean);
    const categoriesLabel = categories.length ? categories.join(', ') : 'nội dung thi đấu';
    const bannerBlock = data.bannerUrl
      ? `<div style="border-bottom:4px solid ${themeBlue};margin-bottom:12px;">
          <img src="${data.bannerUrl}" alt="banner" style="width:100%;max-width:720px;display:block;border:0;outline:none;" />
        </div>`
      : '';
    const contactPhone = data.contactPhone;
    const contactEmail = data.contactEmail;

    const viHtml = ``;

    const enHtml = ``;

    this.sendMailQueued({
      from: this.senderAddress,
      to: data.email,
      subject: `Thư xác nhận hủy nội dung thi đấu - Giải ${tournamentName}`,
      html: `${viHtml}<br/><hr/><br/>${enHtml}`,
    });
  }

  async sendCancelRegisterUnpaid(data: {
    email: string;
    athleteName?: string;
    tournamentName?: string;
    categories?: string[];
    bannerUrl?: string;
    contactPhone?: string;
    contactEmail?: string;
  }) {
    if (!data.email) return;

    const themeBlue = '#0b3d91';
    const lightBg = '#f9fafb';
    const athleteName = data.athleteName?.trim() || 'Tên VĐV';
    const tournamentName = data.tournamentName || 'Giải đấu';
    const categories = (data.categories || []).filter(Boolean);
    const categoriesLabel = categories.length ? categories.join(', ') : 'nội dung thi đấu';
    const bannerBlock = data.bannerUrl
      ? `<div style="border-bottom:4px solid ${themeBlue};margin-bottom:12px;">
          <img src="${data.bannerUrl}" alt="banner" style="width:100%;max-width:720px;display:block;border:0;outline:none;" />
        </div>`
      : '';
    const contactPhone = data.contactPhone;
    const contactEmail = data.contactEmail;

    const viHtml = ``;

    const enHtml = ``;

    this.sendMailQueued({
      from: this.senderAddress,
      to: data.email,
      subject: `Thư xác nhận hủy nội dung thi đấu - Giải ${tournamentName}`,
      html: `${viHtml}<br/><hr/><br/>${enHtml}`,
    });
  }

  /** Gửi email nhắc nhở thanh toán trước ngày thi đấu (24h cuối) */
  async sendReminderPaymentBeforeTournament24Hours(data: {
    email: string;
    athleteName?: string;
    athleteNameEn?: string;
    tournamentName: string;
    tournamentNameEn?: string;
    categories: string[];
    categoriesEn?: string[];
    amount: number;
    payUrl?: string;
    payHistoryUrl?: string;
    startDate?: Date;
    bannerUrl?: string;
    payHistoryLinkLabel?: string;
  }) {
    const themeBlue = '#0b3d91';
    const lightBg = '#f9fafb';

    const athleteNameVi = data.athleteName?.trim() || 'Tên VDV';
    const athleteNameEn =
      data.athleteNameEn?.trim() || data.athleteName?.trim() || "Athlete's Name";
    const tournamentNameEn = data.tournamentNameEn?.trim() || data.tournamentName;

    const categoriesVi = (data.categories || []).filter(Boolean);
    const categoriesEn = (data.categoriesEn || []).filter(Boolean);
    const payLink = data.payUrl || data.payHistoryUrl || '';

    const bannerBlock = data.bannerUrl
      ? `
      <div style="border-bottom:4px solid ${themeBlue};">
        <img src="${data.bannerUrl}" alt="banner" style="width:100%;max-width:720px;display:block;border:0;outline:none;" />
      </div>`
      : '';

    const listVi =
      categoriesVi.length > 0
        ? categoriesVi.map((c, idx) => `<li style="margin:4px 0;">${idx + 1}. ${c}</li>`).join('')
        : '<li style="margin:4px 0;">1.</li>';
    const listEn =
      categoriesEn.length > 0
        ? categoriesEn.map((c, idx) => `<li style="margin:4px 0;">${idx + 1}. ${c}</li>`).join('')
        : '<li style="margin:4px 0;">1.</li>';

    const payAnchorVi = payLink
      ? `<a href="${payLink}" target="_blank" style="color:#ffffff;text-decoration:underline;">Tại đây</a>`
      : 'Tại đây';
    const payAnchorEn = payLink
      ? `<a href="${payLink}" target="_blank" style="color:#ffffff;text-decoration:underline;">Here</a>`
      : 'Here';

    const contactPhone = '';
    const contactEmail = '';

    const htmlVi = ``;

    const htmlEn = ``;

    this.sendMailQueued({
      from: this.senderAddress,
      to: data.email,
      subject: `Bổ sung lệ phí Giải đấu ${data.tournamentName}`,
      html: `${htmlVi}<br/><hr/><br/>${htmlEn}`,
    });
    return true;
  }

  /** Gửi email nhắc nhở sắp đến ngày thi đấu */
  async sendReminderProcessing(data: {
    email: string;
    tournamentName: string;
    startDate: Date;
    address: string;
    tournamentDetailUrl: string;
    reminderType?: '1day' | '3days';
    athleteName?: string;
    athleteNameEn?: string;
    tournamentNameEn?: string;
    categories?: string[];
    categoriesEn?: string[];
    addressEn?: string;
    bannerUrl?: string;
  }) {
    const reminderType = data.reminderType ?? '1day';

    if (reminderType === '1day') {
      const themeBlue = '#0b3d91';
      const lightBg = '#f9fafb';
      const athleteNameVi = data?.athleteName?.trim();
      const athleteNameEn = data?.athleteNameEn?.trim() || data?.athleteName?.trim();
      const tournamentNameEn = data?.tournamentNameEn?.trim() || data.tournamentName;
      const categoriesVi = (data?.categories || []).filter(Boolean);
      const categoriesEn = (data?.categoriesEn || []).filter(Boolean);

      const startDayjs = data.startDate ? dayjs(data.startDate) : null;
      const timeLabelVi = startDayjs ? startDayjs.format('H:mm') : '[giờ dự kiến]';
      const dateLabelVi = startDayjs
        ? `Ngày ${startDayjs.format('DD/MM/YYYY')}`
        : 'Ngày...tháng...năm...';
      const timeDisplay = `${timeLabelVi} || ${dateLabelVi}`;

      const venueVi = data.address?.trim() || '';
      const venueEn = (data as any)?.addressEn?.trim() || data.address?.trim() || '';

      const bannerBlock = (data as any)?.bannerUrl
        ? `
        <div style="border-bottom:4px solid ${themeBlue};">
          <img src="${(data as any)?.bannerUrl}" alt="banner" style="width:100%;max-width:720px;display:block;border:0;outline:none;" />
        </div>`
        : '';

      const listVi =
        categoriesVi.length > 0
          ? categoriesVi.map((c, idx) => `<li style="margin:4px 0;">${idx + 1}. ${c}</li>`).join('')
          : '<li style="margin:4px 0;">1.</li>';
      const listEn =
        categoriesEn.length > 0
          ? categoriesEn.map((c, idx) => `<li style="margin:4px 0;">${idx + 1}. ${c}</li>`).join('')
          : '<li style="margin:4px 0;">2.</li>';

      const contactPhone = '';
      const contactEmail = '';

      const htmlVi = ``;

      const htmlEn = ``;

      this.sendMailQueued({
        from: this.senderAddress,
        to: data.email,
        subject: `Đếm ngược 24 giờ trước khi bắt đầu trận đấu tại [${data.tournamentName}]`,
        html: `${htmlVi}<br/><hr/><br/>${htmlEn}`,
      });
      return true;
    }

    const headingVi = '⏳ Chỉ còn 3 ngày nữa!';
    const headingEn = '⏳ Just 3 days to go!';
    const reminderCopyVi = 'Giải đấu sẽ diễn ra trong 3 ngày nữa';
    const reminderCopyEn = 'The tournament starts in 3 days';
    const reminderTimeVi = 'Trước 3 ngày';
    const reminderTimeEn = '3 days before start';

    const htmlVi = ``;

    const htmlEn = ``;

    this.sendMailQueued({
      from: this.senderAddress,
      to: data.email,
      subject: `Thông báo còn 3 ngày: Giải đấu ${data.tournamentName} sắp khai mạc!`,
      html: `${htmlVi}<br/><hr/><br/>${htmlEn}`,
    });
    return true;
  }

  /** Gửi email xác nhận đăng ký giải đấu thành công */
  async sendEmailNotifyRegisterTournament(data: {
    email: string;
    athleteName?: string;
    athleteNameEn?: string;
    tournamentName: string;
    tournamentNameEn: string;
    categories: string[];
    categoriesEn: string[];
    amount: number;
    paymentUrl?: string;
    payHistoryUrl?: string;
    startDate?: Date;
    endDate?: Date;
    address?: string;
    addressEn?: string;
    tournamentDetailUrl?: string;
    bannerUrl?: string;
    fanpageUrl?: string;
    websiteUrl?: string;
    zaloUrl?: string;
  }) {
    const themeBlue = '#0b3d91';
    const athleteNameVi = data.athleteName?.trim() || 'Tên VĐV';
    const athleteNameEn = data.athleteNameEn?.trim() || data.athleteName?.trim() || 'Athlete';
    const tournamentNameEn = data.tournamentNameEn?.trim() || data.tournamentName;

    const categoriesVi = (data.categories || []).filter(Boolean);
    const categoriesEn = (data.categoriesEn || []).filter(Boolean);

    const formatTimeRangeVi = (startDate?: Date, endDate?: Date) => {
      if (!startDate && !endDate) return 'Đang cập nhật';
      const start = startDate ? dayjs(startDate) : null;
      const end = endDate ? dayjs(endDate) : null;
      if (start && end) {
        const timeRange = `${start.format('H:mm')} - ${end.format('H:mm')}`;
        const dateLabel = start.isSame(end, 'day')
          ? `Ngày ${start.format('DD/MM/YYYY')}`
          : `${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`;
        return `${timeRange} || ${dateLabel}`;
      }
      if (start) return `Ngày ${start.format('DD/MM/YYYY')}`;
      if (end) return `Ngày ${end.format('DD/MM/YYYY')}`;
      return 'Đang cập nhật';
    };

    const formatTimeRangeEn = (startDate?: Date, endDate?: Date) => {
      if (!startDate && !endDate) return 'To be updated';
      const start = startDate ? dayjs(startDate) : null;
      const end = endDate ? dayjs(endDate) : null;
      if (start && end) {
        const timeRange = `${start.format('h:mm A')} – ${end.format('h:mm A')}`;
        const dateLabel = start.isSame(end, 'day')
          ? `${start.format('DD MMM, YYYY')}`
          : `${start.format('DD MMM, YYYY')} – ${end.format('DD MMM, YYYY')}`;
        return `${timeRange}, ${dateLabel}`;
      }
      if (start) return `${start.format('DD MMM, YYYY')}`;
      if (end) return `${end.format('DD MMM, YYYY')}`;
      return 'To be updated';
    };

    const venueVi = data.address?.trim() || '';
    const venueEn = data.addressEn?.trim() || data.address?.trim() || '';

    const scheduleUrl = data.tournamentDetailUrl || '';
    const scheduleLinkVi = scheduleUrl
      ? `<a href="${scheduleUrl}" target="_blank" style="color:#ffffff;text-decoration:underline;">tại đây</a>`
      : `<span style="color:#ffffff;opacity:0.9;">(đang cập nhật)</span>`;
    const scheduleLinkEn = scheduleUrl
      ? `<a href="${scheduleUrl}" target="_blank" style="color:#ffffff;text-decoration:underline;">here</a>`
      : `<span style="color:#ffffff;opacity:0.9;">(to be updated)</span>`;

    const bannerHtml = data.bannerUrl
      ? `
        <div style="border-bottom:4px solid ${themeBlue};">
          <img
            src="${data.bannerUrl}"
            alt="banner"
            width="720"
            height="405"
            style="width:100%;max-width:720px;height:auto;display:block;border:0;outline:none;text-decoration:none;object-fit:cover;aspect-ratio:16/9;"
          />
        </div>`
      : '';

    const fanpageLabelVi = data.fanpageUrl
      ? `<a href="${data.fanpageUrl}" target="_blank" style="color:${themeBlue};font-weight:700;text-decoration:none;">Fanpage D-Joy Lingoarena</a>`
      : `<span style="font-weight:700;">Fanpage D-Joy Lingoarena</span>`;
    const fanpageLabelEn = data.fanpageUrl
      ? `<a href="${data.fanpageUrl}" target="_blank" style="color:${themeBlue};font-weight:700;text-decoration:none;">D-Joy Lingoarena Fanpage</a>`
      : `<span style="font-weight:700;">D-Joy Lingoarena Fanpage</span>`;
    const websiteLabel = data.websiteUrl
      ? `<a href="${data.websiteUrl}" target="_blank" style="color:${themeBlue};font-weight:700;text-decoration:none;">Website</a>`
      : `<span style="font-weight:700;">Website</span>`;
    const zaloLabelVi = data.zaloUrl
      ? `<a href="${data.zaloUrl}" target="_blank" style="color:${themeBlue};font-weight:700;text-decoration:none;">nhóm Zalo</a>`
      : `<span style="font-weight:700;">nhóm Zalo</span>`;
    const zaloLabelEn = data.zaloUrl
      ? `<a href="${data.zaloUrl}" target="_blank" style="color:${themeBlue};font-weight:700;text-decoration:none;">Zalo group</a>`
      : `<span style="font-weight:700;">Zalo group</span>`;

    const renderCategoryList = (items: string[]) => {
      if (!items.length) return `<div style="margin-top:8px;">-</div>`;
      return `
        <ol style="margin:8px 0 0 22px;padding:0;color:#ffffff;">
          ${items.map(i => `<li style="margin:4px 0;">${i}</li>`).join('')}
        </ol>
      `;
    };

    const htmlVi = ``;

    const htmlEn = ``;

    const html = `${htmlVi}<div style="max-width:720px;margin:0 auto;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/></div>${htmlEn}`;

    this.sendMailQueued({
      from: this.senderAddress,
      to: data.email,
      subject: `Thư xác nhận đăng ký tham gia ${data.tournamentName} thành công`,
      html,
    });
    return true;
  }

  /** Gửi email xác nhận đăng ký khóa học thành công */
  async sendEmailNotifyRegisterCourse(data: {
    email: string;
    studentName?: string;
    studentCode?: string;
    courseName?: string;
    courseNameEn?: string;
    className?: string;
    classNameEn?: string;
    classCode?: string;
    coachName?: string;
    startDate?: Date;
    classTime?: string;
    classTimeEn?: string;
    classCapacity?: number;
    venueVi?: string;
    venueEn?: string;
    hotline?: string;
    fanpageUrl?: string;
    bannerUrl?: string;
  }) {
    if (!data.email) return;

    const themeBlue = '#0b3d91';
    const studentNameVi = data.studentName?.trim() || 'Học viên';
    const studentNameEn = data.studentName?.trim() || 'Student';
    const studentCode = data.studentCode?.trim();
    const studentLabelVi = studentCode ? `${studentNameVi} ${studentCode}` : studentNameVi;
    const studentLabelEn = studentCode ? `${studentNameEn} ${studentCode}` : studentNameEn;

    const courseNameVi = data.courseName?.trim() || data.className?.trim() || '';
    const courseNameEn =
      data.courseNameEn?.trim() || data.classNameEn?.trim() || data.className?.trim() || '';
    const classNameVi = data.className?.trim() || courseNameVi;
    const classNameEn = data.classNameEn?.trim() || courseNameEn;
    const classCode = data.classCode?.trim();
    const classLabelVi = classCode ? `${classNameVi} (${classCode})` : classNameVi;
    const classLabelEn = classCode ? `${classNameEn} (${classCode})` : classNameEn;

    const coachNameVi = data.coachName?.trim() || 'Đang cập nhật';
    const coachNameEn = data.coachName?.trim() || 'To be updated';
    const startDateLabelVi = data.startDate
      ? dayjs(data.startDate).format('DD/MM/YYYY')
      : 'Đang cập nhật';
    const startDateLabelEn = data.startDate
      ? dayjs(data.startDate).format('DD MMM, YYYY')
      : 'To be updated';
    const classTimeVi = data.classTime?.trim() || 'Đang cập nhật';
    const classTimeEn = data.classTimeEn?.trim() || data.classTime?.trim() || 'To be updated';
    const classCapacity = Number.isFinite(data.classCapacity)
      ? `${data.classCapacity}`
      : 'Đang cập nhật';
    const classCapacityEn = Number.isFinite(data.classCapacity)
      ? `${data.classCapacity}`
      : 'To be updated';

    const venueVi = data.venueVi?.trim() || '';
    const venueEn = data.venueEn?.trim() || '';
    const hotline = data.hotline?.trim() || '0969 719 898';
    const fanpageUrl = data.fanpageUrl?.trim() || '';
    const fanpageLink = `<a href="${fanpageUrl}" target="_blank" style="color:${themeBlue};text-decoration:none;">${fanpageUrl}</a>`;
    const bannerHtml = data.bannerUrl
      ? `
        <div style="border-bottom:4px solid ${themeBlue};">
          <img
            src="${data.bannerUrl}"
            alt="banner"
            style="width:100%;max-width:720px;display:block;border:0;outline:none;text-decoration:none;"
          />
        </div>`
      : '';

    const htmlVi = ``;

    const htmlEn = ``;

    const html = `${htmlVi}<div style="max-width:720px;margin:0 auto;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/></div>${htmlEn}`;

    this.sendMailQueued({
      from: this.senderAddress,
      to: data.email,
      subject: `Đăng ký thành công khóa học Lingoarena ${courseNameVi}`,
      html,
    });
    return true;
  }

  async sendRejectRefundRequest(data: {
    email: string;
    athleteName?: string;
    athleteNameEn?: string;
    contactPhone?: string;
    contactEmail?: string;
  }) {
    if (!data.email) return;

    const themeBlue = '#0b3d91';
    const lightBg = '#f9fafb';

    const viHtml = ``;

    const enHtml = ``;

    console.log('Sending reject refund email to:', data.email);

    this.sendMailQueued({
      from: this.senderAddress,
      to: data.email,
      subject: `Thư từ chối yêu cầu hoàn tiền`,
      html: `${viHtml}<br/><hr/><br/>${enHtml}`,
    });
  }

  async sendEmailClassDateChange(data: {
    lstEmail: string[];
    courseClassName?: string;
    courseClassNameEn?: string;
    courseId?: string;
    classId?: string;
  }) {
    if (!data.lstEmail || !data.lstEmail.length) return;
    const themeBlue = '#0b3d91';

    const htmlVn = ``;

    const htmlEn = ``;

    data.lstEmail.forEach(email => {
      this.sendMailQueued({
        from: this.senderAddress,
        to: email,
        subject: `Thông báo thay đổi lịch học lớp ${data.courseClassName || data.courseClassNameEn || 'Lingoarena'}`,
        html: `${htmlVn}<br/><hr/><br/>${htmlEn}`,
      });
    });
  }

  async sendEmailClassOpened(data: {
    email: string;
    studentName?: string;
    courseName?: string;
    courseNameEn?: string;
    coachName?: string;
    coachNameEn?: string;
    startDate?: string;
    startDateEn?: string;
    classTime?: string;
    classTimeEn?: string;
    venue?: string;
    venueEn?: string;
    hotline?: string;
    fanpageUrl?: string;
  }) {
    if (!data.email) return;

    const themeBlue = '#0b3d91';
    const studentName = data.studentName?.trim() || 'Học viên';
    const courseNameVi = data.courseName?.trim() || 'Khóa học Lingoarena';
    const courseNameEn =
      data.courseNameEn?.trim() || data.courseName?.trim() || 'Lingoarena Course';
    const coachNameVi = data.coachName?.trim() || 'Đang cập nhật';
    const coachNameEn = data.coachNameEn?.trim() || data.coachName?.trim() || 'To be updated';
    const startDateVi = data.startDate?.trim() || 'Đang cập nhật';
    const startDateEn = data.startDateEn?.trim() || data.startDate?.trim() || 'To be updated';
    const classTimeVi = data.classTime?.trim() || 'Đang cập nhật';
    const classTimeEn = data.classTimeEn?.trim() || data.classTime?.trim() || 'To be updated';
    const venueVi = data.venue?.trim() || '';
    const venueEn = data.venueEn?.trim() || '';
    const hotline = data.hotline?.trim() || '0969 719 898';
    const fanpageUrl = data.fanpageUrl?.trim() || '';
    const fanpageLink = `<a href="${fanpageUrl}" target="_blank" style="color:${themeBlue};text-decoration:none;">${fanpageUrl}</a>`;

    const htmlVn = ` `;

    const htmlEn = ` `;

    this.sendMailQueued({
      from: this.senderAddress,
      to: data.email,
      subject: `Thông báo mở lớp mới ${courseNameVi}`,
      html: `${htmlVn}<br/><hr/><br/>${htmlEn}`,
    });
    return true;
  }
}
