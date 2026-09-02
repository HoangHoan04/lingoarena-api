import {
  VocabularyCollocationEntity,
  VocabularyDeckEntity,
  VocabularyEntity,
  VocabularyExampleEntity,
  VocabularyRelationEntity,
} from '~/entities';

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
  const example = (word.examples || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0];
  const collocations = (word.collocations || [])
    .slice()
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((item: VocabularyCollocationEntity) => ({
      id: item.id,
      collocation: item.collocation,
      meaningVi: item.meaningVi || null,
      exampleSentence: item.exampleSentence || null,
      sortOrder: item.sortOrder,
    }));
  const relations = (word.relations || []).map((item: VocabularyRelationEntity) => ({
    id: item.id,
    relationType: item.relationType,
    relatedVocabularyId: item.relatedVocabularyId,
    relatedHeadword: item.relatedVocabulary?.headword || null,
    relatedMeaningVi: item.relatedVocabulary?.meaningVi || null,
    relatedPartOfSpeech: item.relatedVocabulary?.partOfSpeech || null,
  }));
  const topics = (word.vocabularyTopics || [])
    .map(item => item.topic)
    .filter(Boolean)
    .map(topic => ({ id: topic.id, code: topic.code, name: topic.name }));
  const examTypes = (word.vocabularyExamTypes || [])
    .map(item => item.examType)
    .filter(Boolean)
    .map(exam => ({ id: exam.id, code: exam.code, name: exam.name }));

  return {
    id: word.id,
    headword: word.headword,
    normalizedWord: word.normalizedWord,
    partOfSpeech: word.partOfSpeech,
    ipaUk: word.ipaUk || null,
    ipaUs: word.ipaUs || null,
    audioUkAssetId: word.audioUkAssetId || null,
    audioUsAssetId: word.audioUsAssetId || null,
    audioUkUrl: word.audioUkAsset?.publicUrl || null,
    audioUsUrl: word.audioUsAsset?.publicUrl || null,
    definitionEn: word.definitionEn,
    meaningVi: word.meaningVi,
    cefrLevel: word.cefrLevel || null,
    status: word.status,
    frequencyLevel: word.frequencyLevel || 1,
    isDeleted: word.isDeleted,
    exampleEn: example?.sentence || null,
    exampleVi: example?.translation || null,
    examples: (word.examples || []).map((item: VocabularyExampleEntity) => ({
      id: item.id,
      sentence: item.sentence,
      translation: item.translation,
      sortOrder: item.sortOrder,
    })),
    collocations,
    relations,
    topics,
    examTypes,
    topicIds: topics.map(item => item.id),
    examTypeIds: examTypes.map(item => item.id),
    ...extra,
  };
}

export function buildPublicDeck(deck: VocabularyDeckEntity, extra?: Record<string, unknown>) {
  return {
    id: deck.id,
    title: deck.title,
    slug: deck.slug,
    description: deck.description || null,
    thumbnailUrl: deck.thumbnailUrl || null,
    visibility: deck.visibility,
    ownerType: deck.ownerType,
    examTypeId: deck.examTypeId || null,
    examType: deck.examType
      ? { id: deck.examType.id, code: deck.examType.code, name: deck.examType.name }
      : null,
    level: deck.level || null,
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
