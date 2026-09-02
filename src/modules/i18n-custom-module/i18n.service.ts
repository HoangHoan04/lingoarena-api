import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService as NestI18nService } from 'nestjs-i18n';

@Injectable()
export class I18nCustomService {
  constructor(private readonly i18n: NestI18nService) {}

  getCurrentLang(): string {
    return I18nContext.current()?.lang || 'vi';
  }

  getKeyName(val = 'name'): string {
    const lang = this.getCurrentLang();
    return val + lang?.charAt(0).toUpperCase() + lang?.slice(1)?.toLowerCase();
  }

  translate(key: string, args?: Record<string, any>): string {
    return this.i18n.translate(key, {
      args,
      lang: I18nContext.current()?.lang,
    });
  }

  authTranslate(key: string, args?: Record<string, any>): string {
    return this.i18n.translate(`auth.${key}`, {
      args,
      lang: I18nContext.current()?.lang,
    });
  }

  paymentTranslate(key: string, args?: Record<string, any>): string {
    return this.i18n.translate(`payment.${key}`, {
      args,
      lang: I18nContext.current()?.lang,
    });
  }

  commonTranslate(key: string, args?: Record<string, any>): string {
    return this.i18n.translate(`common.${key}`, {
      args,
      lang: I18nContext.current()?.lang,
    });
  }

  bannerTranslate(key: string, args?: Record<string, any>): string {
    return this.i18n.translate(`banner.${key}`, {
      args,
      lang: I18nContext.current()?.lang,
    });
  }

  newsTranslate(key: string, args?: Record<string, any>): string {
    return this.i18n.translate(`news.${key}`, {
      args,
      lang: I18nContext.current()?.lang,
    });
  }

  feedbackTranslate(key: string, args?: Record<string, any>): string {
    return this.i18n.translate(`feedback.${key}`, {
      args,
      lang: I18nContext.current()?.lang,
    });
  }

  tournamentTranslate(key: string, args?: Record<string, any>): string {
    return this.i18n.translate(`tournament.${key}`, {
      args,
      lang: I18nContext.current()?.lang,
    });
  }

  mobileRefereeTranslate(key: string, args?: Record<string, any>): string {
    return this.i18n.translate(`referee.${key}`, {
      args,
      lang: I18nContext.current()?.lang,
    });
  }
}
