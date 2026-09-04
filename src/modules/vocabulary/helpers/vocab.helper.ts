import { VocabularyDeckEntity, VocabularyEntity, VocabularyRelationEntity } from '~/entities';

export function normalizeHeadword(raw: string): string {
  return (raw || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function slugify(raw: string): string {
  return (raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function buildPublicWord(word: VocabularyEntity, extra?: Record<string, unknown>) {
  const examples = word.examplesJson || [];
  const example = examples[0] || null;
  const collocations = word.collocationsJson || [];
  const relations = (word.relations || []).map((item: VocabularyRelationEntity) => ({
    id: item.id,
    relationType: item.relationType,
    relatedVocabularyId: item.relatedVocabularyId,
    relatedHeadword: item.relatedVocabulary?.headword || null,
    relatedMeaningVi: item.relatedVocabulary?.meaningVi || null,
    relatedPartOfSpeech: item.relatedVocabulary?.partOfSpeech || null,
  }));

  return {
    id: word.id,
    headword: word.headword,
    normalizedWord: word.normalizedWord,
    partOfSpeech: word.partOfSpeech,
    ipaUk: word.ipaUk || null,
    ipaUs: word.ipaUs || null,
    audioUkUrl: word.audioUkUrl || null,
    audioUsUrl: word.audioUsUrl || null,
    imageUrl: word.imageUrl || null,
    definitionVi: word.definitionVi || null,
    definitionEn: word.definitionEn || null,
    meaningVi: word.meaningVi,
    cefrLevel: word.cefrLevel || null,
    frequencyLevel: word.frequencyLevel || 1,
    isDeleted: word.isDeleted,
    exampleEn: (example as { sentence?: string } | null)?.sentence || null,
    exampleVi: (example as { translation?: string } | null)?.translation || null,
    examples,
    collocations,
    relations,
    ...extra,
  };
}

export function buildPublicDeck(deck: VocabularyDeckEntity, extra?: Record<string, unknown>) {
  return {
    id: deck.id,
    title: deck.title,
    titleEn: deck.titleEn || null,
    slug: deck.slug,
    description: deck.description || null,
    thumbnailUrl: deck.thumbnailUrl || null,
    visibility: deck.visibility,
    ownerType: deck.ownerType,
    cefrLevel: deck.cefrLevel || null,
    level: deck.cefrLevel || null,
    itemCount: deck.itemCount || 0,
    isDeleted: deck.isDeleted,
    estimatedMinutes: Math.max(3, Math.ceil((deck.itemCount || 0) * 0.4)),
    ...extra,
  };
}

export type QuizOption = { id: string; text: string };

export function buildQuizQuestion(word: VocabularyEntity, pool: VocabularyEntity[]) {
  const distractors = pool
    .filter(item => item.id !== word.id && item.meaningVi && item.meaningVi !== word.meaningVi)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const options: QuizOption[] = [
    { id: word.id, text: word.meaningVi },
    ...distractors.map(item => ({ id: item.id, text: item.meaningVi })),
  ].sort(() => Math.random() - 0.5);

  return {
    vocabularyId: word.id,
    prompt: word.headword,
    promptIpa: word.ipaUs || word.ipaUk || null,
    partOfSpeech: word.partOfSpeech,
    question: `Nghĩa tiếng Việt của “${word.headword}” là gì?`,
    options,
  };
}
