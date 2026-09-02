import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { BusinessException } from '~/common/systems/exceptions';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import { TranslateDto } from '../dto';
import {
  assertProviderConfigured,
  dictionaryAzure,
  dictionaryFreeEnglish,
  getTranslateCache,
  isDictionaryQuery,
  mergeDictionary,
  resolveTranslateProvider,
  setTranslateCache,
  TranslateDictionaryData,
  translateAzure,
  translateCacheKey,
  translateGoogle,
  translateMyMemory,
} from '../helpers';

export interface TranslateResultData {
  translatedText: string;
  detectedSourceLang?: string;
  provider: string;
  dictionary: TranslateDictionaryData | null;
}

@Injectable()
export class TranslateService {
  private readonly logger = new Logger(TranslateService.name);

  constructor(
    private readonly http: HttpService,
    private readonly i18n: I18nCustomService,
  ) {}

  async translate(dto: TranslateDto) {
    const text = dto.text?.trim() || '';
    if (!text) {
      throw new BusinessException(this.i18n.commonTranslate('translate_text_required'));
    }
    if (text.length > 5000) {
      throw new BusinessException(this.i18n.commonTranslate('translate_text_too_long'));
    }

    const sourceLang = dto.sourceLang || 'auto';
    const targetLang = dto.targetLang;
    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      return {
        message: this.i18n.commonTranslate('translate_success'),
        data: {
          translatedText: text,
          detectedSourceLang: sourceLang,
          provider: 'none',
          dictionary: null,
        } as TranslateResultData,
      };
    }

    const cacheKey = translateCacheKey(sourceLang, targetLang, text);
    const cached = getTranslateCache<TranslateResultData>(cacheKey);
    if (cached) {
      return { message: this.i18n.commonTranslate('translate_success'), data: cached };
    }

    const provider = resolveTranslateProvider();
    try {
      assertProviderConfigured(provider);
    } catch {
      throw new BusinessException(this.i18n.commonTranslate('translate_provider_not_configured'));
    }

    try {
      const translated =
        provider === 'azure'
          ? await translateAzure(this.http, text, sourceLang, targetLang)
          : provider === 'google'
            ? await translateGoogle(this.http, text, sourceLang, targetLang)
            : await translateMyMemory(this.http, text, sourceLang, targetLang);

      if (!translated.translatedText) {
        throw new BusinessException(this.i18n.commonTranslate('translate_failed'));
      }

      const detected = translated.detectedSourceLang || (sourceLang === 'auto' ? undefined : sourceLang);
      let dictionary: TranslateDictionaryData | null = null;
      if (isDictionaryQuery(text)) {
        dictionary = await this.loadDictionary(text, detected || sourceLang, targetLang, provider);
      }

      const payload: TranslateResultData = {
        translatedText: translated.translatedText,
        detectedSourceLang: detected,
        provider: translated.provider,
        dictionary,
      };
      setTranslateCache(cacheKey, payload);
      return { message: this.i18n.commonTranslate('translate_success'), data: payload };
    } catch (err: any) {
      if (err instanceof BusinessException) throw err;
      this.logger.error(err?.response?.data || err?.message || err);
      throw new BusinessException(this.i18n.commonTranslate('translate_failed'));
    }
  }

  private async loadDictionary(
    text: string,
    sourceLang: string,
    targetLang: string,
    provider: string,
  ): Promise<TranslateDictionaryData | null> {
    const azureTask =
      provider === 'azure' && sourceLang && sourceLang !== 'auto'
        ? dictionaryAzure(this.http, text, sourceLang, targetLang).catch(() => null)
        : Promise.resolve(null);
    const lexicalTask =
      sourceLang === 'en' || sourceLang === 'auto'
        ? dictionaryFreeEnglish(this.http, text)
        : Promise.resolve(null);
    const [azureDict, lexicalDict] = await Promise.all([azureTask, lexicalTask]);
    return mergeDictionary(azureDict, lexicalDict);
  }
}
