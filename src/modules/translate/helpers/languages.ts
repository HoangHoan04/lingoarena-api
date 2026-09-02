export const TRANSLATE_LANG_CODES = [
  'auto',
  'en',
  'vi',
  'ja',
  'ko',
  'zh',
  'zh-TW',
  'fr',
  'de',
  'es',
  'it',
  'ru',
  'pt',
  'th',
  'id',
  'ms',
  'ar',
  'hi',
  'bn',
  'nl',
  'pl',
  'tr',
  'sv',
  'no',
  'da',
  'fi',
  'el',
  'cs',
  'hu',
  'ro',
  'uk',
  'he',
  'fa',
  'la',
  'my',
  'km',
  'lo',
  'tl',
] as const;

export type TranslateLangCode = (typeof TRANSLATE_LANG_CODES)[number];

export type TranslateProviderName = 'azure' | 'google' | 'mymemory';

const AZURE_MAP: Record<string, string> = {
  zh: 'zh-Hans',
  'zh-TW': 'zh-Hant',
  tl: 'fil',
};

const GOOGLE_MAP: Record<string, string> = {
  zh: 'zh-CN',
  tl: 'fil',
};

const MYMEMORY_MAP: Record<string, string> = {
  zh: 'zh-CN',
  tl: 'tl',
};

export function toAzureLang(code: string): string | undefined {
  if (!code || code === 'auto') return undefined;
  return AZURE_MAP[code] || code;
}

export function toGoogleLang(code: string): string | undefined {
  if (!code || code === 'auto') return undefined;
  return GOOGLE_MAP[code] || code;
}

export function toMyMemoryLang(code: string): string {
  if (!code || code === 'auto') return 'Autodetect';
  return MYMEMORY_MAP[code] || code;
}

export function fromAzureLang(code?: string): string | undefined {
  if (!code) return undefined;
  if (code === 'zh-Hans' || code === 'zh-CHS') return 'zh';
  if (code === 'zh-Hant' || code === 'zh-CHT') return 'zh-TW';
  if (code === 'fil') return 'tl';
  return code;
}

export function fromGoogleLang(code?: string): string | undefined {
  if (!code) return undefined;
  if (code === 'zh-CN' || code === 'zh') return 'zh';
  if (code === 'fil') return 'tl';
  return code;
}

export function guessSourceLang(text: string): string {
  const sample = text.slice(0, 400);
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(sample)) {
    return 'vi';
  }
  if (/[\u3040-\u30ff]/.test(sample)) return 'ja';
  if (/[\uac00-\ud7af]/.test(sample)) return 'ko';
  if (/[\u4e00-\u9fff]/.test(sample)) return 'zh';
  if (/[\u0600-\u06ff]/.test(sample)) return 'ar';
  if (/[\u0400-\u04ff]/.test(sample)) return 'ru';
  if (/[\u0e00-\u0e7f]/.test(sample)) return 'th';
  if (/[\u0900-\u097f]/.test(sample)) return 'hi';
  return 'en';
}

export function isSupportedLang(code: string): boolean {
  return (TRANSLATE_LANG_CODES as readonly string[]).includes(code);
}

export const TRANSLATE_TARGET_CODES = TRANSLATE_LANG_CODES.filter((code) => code !== 'auto');

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
