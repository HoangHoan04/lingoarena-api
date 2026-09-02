export interface TranslateDictionaryMeaning {
  pos: string;
  definitions: {
    definition: string;
    example?: string;
    synonyms?: string[];
  }[];
}

export interface TranslateDictionaryData {
  headword: string;
  ipa?: string;
  partOfSpeech?: string;
  meanings: TranslateDictionaryMeaning[];
  alternateTranslations?: {
    translation: string;
    reverseTranslation: string[];
    frequency: 1 | 2 | 3;
  }[];
  examples?: {
    source: string;
    target: string;
  }[];
}

export function isDictionaryQuery(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 80) return false;
  const words = trimmed.split(/\s+/);
  return words.length > 0 && words.length <= 4;
}

export function confidenceToFrequency(confidence: number): 1 | 2 | 3 {
  if (confidence >= 0.35) return 3;
  if (confidence >= 0.12) return 2;
  return 1;
}

const POS_LABELS: Record<string, string> = {
  VERB: 'động từ (verb)',
  NOUN: 'danh từ (noun)',
  ADJ: 'tính từ (adjective)',
  ADV: 'trạng từ (adverb)',
  CONJ: 'liên từ (conjunction)',
  DET: 'mạo từ (determiner)',
  MODAL: 'động từ khuyết thiếu (modal)',
  PREP: 'giới từ (preposition)',
  PRON: 'đại từ (pronoun)',
  OTHER: 'khác',
  verb: 'động từ (verb)',
  noun: 'danh từ (noun)',
  adjective: 'tính từ (adjective)',
  adverb: 'trạng từ (adverb)',
  interjection: 'thán từ (interjection)',
  pronoun: 'đại từ (pronoun)',
  preposition: 'giới từ (preposition)',
  conjunction: 'liên từ (conjunction)',
  determiner: 'mạo từ (determiner)',
};

export function posLabel(pos?: string): string {
  if (!pos) return '';
  return POS_LABELS[pos] || POS_LABELS[pos.toUpperCase()] || pos;
}

export function mergeDictionary(
  azure?: TranslateDictionaryData | null,
  lexical?: TranslateDictionaryData | null,
): TranslateDictionaryData | null {
  if (!azure && !lexical) return null;
  const base: TranslateDictionaryData = {
    headword: azure?.headword || lexical?.headword || '',
    ipa: lexical?.ipa || azure?.ipa,
    partOfSpeech: lexical?.partOfSpeech || azure?.partOfSpeech,
    meanings: lexical?.meanings?.length ? lexical.meanings : azure?.meanings || [],
    alternateTranslations:
      azure?.alternateTranslations?.length
        ? azure.alternateTranslations
        : lexical?.alternateTranslations || [],
    examples: azure?.examples?.length ? azure.examples : lexical?.examples || [],
  };
  if (!base.headword) return null;
  if (!base.meanings.length && !base.alternateTranslations?.length && !base.examples?.length) {
    return null;
  }
  return base;
}
