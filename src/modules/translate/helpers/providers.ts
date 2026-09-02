import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  confidenceToFrequency,
  posLabel,
  TranslateDictionaryData,
} from './dictionary';
import {
  decodeHtmlEntities,
  fromAzureLang,
  fromGoogleLang,
  guessSourceLang,
  toAzureLang,
  toGoogleLang,
  toMyMemoryLang,
  TranslateProviderName,
} from './languages';

export interface ProviderTranslateResult {
  translatedText: string;
  detectedSourceLang?: string;
  provider: TranslateProviderName;
}

function azureHeaders() {
  const key = process.env.AZURE_TRANSLATOR_KEY || '';
  const region = process.env.AZURE_TRANSLATOR_REGION || '';
  return {
    'Ocp-Apim-Subscription-Key': key,
    'Ocp-Apim-Subscription-Region': region,
    'Content-Type': 'application/json',
  };
}

export async function translateAzure(
  http: HttpService,
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<ProviderTranslateResult> {
  const from = toAzureLang(sourceLang);
  const to = toAzureLang(targetLang);
  const params = new URLSearchParams({ 'api-version': '3.0', to: to || 'vi' });
  if (from) params.set('from', from);

  const { data } = await firstValueFrom(
    http.post<any[]>(
      `https://api.cognitive.microsofttranslator.com/translate?${params.toString()}`,
      [{ Text: text }],
      { headers: azureHeaders() },
    ),
  );

  const row = data?.[0];
  const translatedText = row?.translations?.[0]?.text || '';
  const detected = fromAzureLang(row?.detectedLanguage?.language || from);
  return { translatedText, detectedSourceLang: detected, provider: 'azure' };
}

export async function dictionaryAzure(
  http: HttpService,
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslateDictionaryData | null> {
  const from = toAzureLang(sourceLang);
  const to = toAzureLang(targetLang);
  if (!from || !to) return null;

  const { data } = await firstValueFrom(
    http.post<any[]>(
      `https://api.cognitive.microsofttranslator.com/dictionary/lookup?api-version=3.0&from=${from}&to=${to}`,
      [{ Text: text }],
      { headers: azureHeaders() },
    ),
  );

  const row = data?.[0];
  const translations = Array.isArray(row?.translations) ? row.translations : [];
  if (!translations.length) return null;

  const alternateTranslations = translations.slice(0, 8).map((item: any) => ({
    translation: item.displayTarget || item.normalizedTarget,
    reverseTranslation: (item.backTranslations || [])
      .slice(0, 4)
      .map((bt: any) => bt.displayText || bt.normalizedText)
      .filter(Boolean),
    frequency: confidenceToFrequency(Number(item.confidence || 0)),
  }));

  const meaningsMap = new Map<string, TranslateDictionaryData['meanings'][number]>();
  for (const item of translations.slice(0, 10)) {
    const pos = posLabel(item.posTag) || 'khác';
    if (!meaningsMap.has(pos)) {
      meaningsMap.set(pos, { pos, definitions: [] });
    }
    const group = meaningsMap.get(pos);
    group?.definitions.push({
      definition: item.displayTarget,
      synonyms: (item.backTranslations || [])
        .slice(0, 4)
        .map((bt: any) => bt.displayText)
        .filter(Boolean),
    });
  }

  let examples: TranslateDictionaryData['examples'] = [];
  const top = translations[0];
  if (top?.displayTarget) {
    try {
      const exampleRes = await firstValueFrom(
        http.post<any[]>(
          `https://api.cognitive.microsofttranslator.com/dictionary/examples?api-version=3.0&from=${from}&to=${to}`,
          [{ Text: text, Translation: top.displayTarget }],
          { headers: azureHeaders() },
        ),
      );
      examples = (exampleRes.data?.[0]?.examples || []).slice(0, 4).map((ex: any) => ({
        source: `${ex.sourcePrefix || ''}${ex.sourceTerm || ''}${ex.sourceSuffix || ''}`.trim(),
        target: `${ex.targetPrefix || ''}${ex.targetTerm || ''}${ex.targetSuffix || ''}`.trim(),
      }));
    } catch {
      examples = [];
    }
  }

  return {
    headword: row.displaySource || text,
    partOfSpeech: posLabel(translations[0]?.posTag),
    meanings: Array.from(meaningsMap.values()),
    alternateTranslations,
    examples,
  };
}

export async function translateGoogle(
  http: HttpService,
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<ProviderTranslateResult> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY || '';
  const body: Record<string, string | string[]> = {
    q: text,
    target: toGoogleLang(targetLang) || 'vi',
    format: 'text',
  };
  const source = toGoogleLang(sourceLang);
  if (source) body.source = source;

  const { data } = await firstValueFrom(
    http.post<any>(`https://translation.googleapis.com/language/translate/v2?key=${key}`, body),
  );

  const row = data?.data?.translations?.[0];
  return {
    translatedText: decodeHtmlEntities(row?.translatedText || ''),
    detectedSourceLang: fromGoogleLang(row?.detectedSourceLanguage || source),
    provider: 'google',
  };
}

function splitForMyMemory(text: string): string[] {
  if (text.length <= 450) return [text];
  const parts = text.split(/(?<=[.!?。！？\n])\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const part of parts) {
    if ((current + ' ' + part).trim().length > 450) {
      if (current) chunks.push(current.trim());
      if (part.length > 450) {
        for (let i = 0; i < part.length; i += 450) chunks.push(part.slice(i, i + 450));
        current = '';
      } else {
        current = part;
      }
    } else {
      current = current ? `${current} ${part}` : part;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text.slice(0, 450)];
}

export async function translateMyMemory(
  http: HttpService,
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<ProviderTranslateResult> {
  const email = process.env.TRANSLATE_MYMEMORY_EMAIL || '';
  const source = sourceLang === 'auto' ? guessSourceLang(text) : toMyMemoryLang(sourceLang);
  const target = toMyMemoryLang(targetLang);
  const chunks = splitForMyMemory(text);
  const translated: string[] = [];

  for (const chunk of chunks) {
    const params: Record<string, string> = {
      q: chunk,
      langpair: `${source}|${target}`,
    };
    if (email) params.de = email;
    const { data } = await firstValueFrom(
      http.get<any>('https://api.mymemory.translated.net/get', { params }),
    );
    const piece = decodeHtmlEntities(data?.responseData?.translatedText || '');
    if (piece) translated.push(piece);
  }

  return {
    translatedText: translated.join(' '),
    detectedSourceLang: source === 'Autodetect' ? guessSourceLang(text) : sourceLang === 'auto' ? source : sourceLang,
    provider: 'mymemory',
  };
}

export async function dictionaryFreeEnglish(
  http: HttpService,
  text: string,
): Promise<TranslateDictionaryData | null> {
  const word = text.trim().split(/\s+/)[0];
  if (!word || /[^a-zA-Z'-]/.test(word)) return null;
  try {
    const { data } = await firstValueFrom(
      http.get<any[]>(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`),
    );
    const entry = data?.[0];
    if (!entry) return null;
    const meanings = (entry.meanings || []).slice(0, 4).map((meaning: any) => ({
      pos: posLabel(meaning.partOfSpeech) || meaning.partOfSpeech,
      definitions: (meaning.definitions || []).slice(0, 3).map((def: any) => {
        const synonyms = [
          ...(Array.isArray(def.synonyms) ? def.synonyms : []),
          ...(Array.isArray(meaning.synonyms) ? meaning.synonyms : []),
        ].filter(Boolean);
        return {
          definition: def.definition,
          example: def.example,
          synonyms: Array.from(new Set(synonyms)).slice(0, 6),
        };
      }),
    }));
    const ipa =
      entry.phonetic ||
      (entry.phonetics || []).find((p: any) => p.text)?.text ||
      undefined;
    return {
      headword: entry.word || word,
      ipa,
      partOfSpeech: meanings[0]?.pos,
      meanings,
      examples: meanings
        .flatMap((m: any) => m.definitions)
        .filter((d: any) => d.example)
        .slice(0, 4)
        .map((d: any) => ({ source: d.example, target: '' })),
    };
  } catch {
    return null;
  }
}

export function resolveTranslateProvider(): TranslateProviderName {
  const forced = (process.env.TRANSLATE_PROVIDER || 'auto').toLowerCase();
  if (forced === 'azure' || forced === 'google' || forced === 'mymemory') return forced;
  if (process.env.AZURE_TRANSLATOR_KEY) return 'azure';
  if (process.env.GOOGLE_TRANSLATE_API_KEY) return 'google';
  return 'mymemory';
}

export function assertProviderConfigured(provider: TranslateProviderName): void {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && provider === 'mymemory') {
    throw new Error('Production requires Azure Translator or Google Translate API keys');
  }
  if (provider === 'azure' && !process.env.AZURE_TRANSLATOR_KEY) {
    throw new Error('AZURE_TRANSLATOR_KEY is missing');
  }
  if (provider === 'google' && !process.env.GOOGLE_TRANSLATE_API_KEY) {
    throw new Error('GOOGLE_TRANSLATE_API_KEY is missing');
  }
}
