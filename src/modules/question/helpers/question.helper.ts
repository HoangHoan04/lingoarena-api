import { enumData } from '~/common/enums/base.enum';

export const AUTO_GRADE_TYPES = [
  enumData.QUESTION_TYPE_CODE.SINGLE_CHOICE.code,
  enumData.QUESTION_TYPE_CODE.MULTI_CHOICE.code,
  enumData.QUESTION_TYPE_CODE.TRUE_FALSE_NG.code,
  enumData.QUESTION_TYPE_CODE.FILL_BLANK.code,
  enumData.QUESTION_TYPE_CODE.MATCHING.code,
];

type OptionLike = {
  optionKey: string;
  content: string;
  isCorrect?: boolean;
  feedback?: string;
  sortOrder?: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function uniqueKeys(keys: string[]) {
  return [...new Set(keys.map(item => item.trim()).filter(Boolean))];
}

export function deriveCorrectAnswer(
  typeCode: string,
  options: OptionLike[] = [],
  correctAnswerJson?: Record<string, unknown>,
): Record<string, unknown> {
  if (typeCode === enumData.QUESTION_TYPE_CODE.SINGLE_CHOICE.code) {
    const key =
      options.find(item => item.isCorrect)?.optionKey ||
      String(correctAnswerJson?.optionKey || '');
    return { optionKey: key };
  }
  if (typeCode === enumData.QUESTION_TYPE_CODE.MULTI_CHOICE.code) {
    const keys = uniqueKeys(
      options.filter(item => item.isCorrect).map(item => item.optionKey),
    );
    if (keys.length) return { optionKeys: keys };
    const fromJson = Array.isArray(correctAnswerJson?.optionKeys)
      ? (correctAnswerJson?.optionKeys as unknown[]).map(item => String(item))
      : [];
    return { optionKeys: uniqueKeys(fromJson) };
  }
  return asRecord(correctAnswerJson);
}

export function mediaUrl(asset?: { publicUrl?: string | null }, fallback?: unknown) {
  return asset?.publicUrl || (typeof fallback === 'string' ? fallback : null) || null;
}

export function buildQuestionPayload(question: any, publicOnly = false) {
  const version = question.currentVersion;
  const contentJson = asRecord(version?.contentJson);
  const groupMeta = asRecord(question.questionGroup?.metadata);
  const options = (version?.options || [])
    .slice()
    .sort((a: OptionLike, b: OptionLike) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((item: OptionLike) => ({
      id: (item as any).id,
      optionKey: item.optionKey,
      content: item.content,
      sortOrder: item.sortOrder || 0,
      feedback: publicOnly ? undefined : item.feedback,
      isCorrect: publicOnly ? undefined : Boolean(item.isCorrect),
    }));

  const payload: Record<string, any> = {
    id: question.id,
    questionGroupId: question.questionGroupId,
    examTypeId: question.examTypeId,
    examSkillId: question.examSkillId,
    examSectionId: question.examSectionId,
    questionTypeId: question.questionTypeId,
    difficultyLevel: question.difficultyLevel,
    cefrLevel: question.cefrLevel,
    defaultPoints: Number(question.defaultPoints || 1),
    status: question.status,
    currentVersionId: question.currentVersionId,
    isDeleted: question.isDeleted,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    examType: question.examType
      ? { id: question.examType.id, code: question.examType.code, name: question.examType.name }
      : null,
    examSkill: question.examSkill
      ? { id: question.examSkill.id, code: question.examSkill.code, name: question.examSkill.name }
      : null,
    examSection: question.examSection
      ? {
          id: question.examSection.id,
          code: question.examSection.code,
          name: question.examSection.name,
        }
      : null,
    questionType: question.questionType
      ? {
          id: question.questionType.id,
          code: question.questionType.code,
          name: question.questionType.name,
          gradingStrategy: question.questionType.gradingStrategy,
          supportsAutoGrading: question.questionType.supportsAutoGrading,
        }
      : null,
    questionGroup: question.questionGroup
      ? {
          id: question.questionGroup.id,
          title: question.questionGroup.title,
          instructions: question.questionGroup.instructions,
          stimulusType: question.questionGroup.stimulusType,
          passageText: question.questionGroup.passageText,
          transcript: publicOnly ? undefined : question.questionGroup.transcript,
          imageUrl: mediaUrl(question.questionGroup.imageAsset, groupMeta.imageUrl),
          audioUrl: mediaUrl(question.questionGroup.audioAsset, groupMeta.audioUrl),
        }
      : null,
    topics: (question.questionTopics || [])
      .map((item: any) => item.topic)
      .filter(Boolean)
      .map((topic: any) => ({ id: topic.id, code: topic.code, name: topic.name })),
    tags: (question.questionTags || [])
      .map((item: any) => item.tag)
      .filter(Boolean)
      .map((tag: any) => ({ id: tag.id, name: tag.name })),
    topicIds: (question.questionTopics || []).map((item: any) => item.topicId).filter(Boolean),
    tagIds: (question.questionTags || []).map((item: any) => item.tagId).filter(Boolean),
    prompt: version?.prompt || '',
    instructions: version?.instructions,
    explanation: publicOnly ? undefined : version?.explanation,
    contentJson: version?.contentJson || null,
    correctAnswerJson: publicOnly ? undefined : version?.correctAnswerJson,
    gradingConfigJson: publicOnly ? undefined : version?.gradingConfigJson,
    imageUrl: mediaUrl(version?.imageAsset, contentJson.imageUrl),
    audioUrl: mediaUrl(version?.audioAsset, contentJson.audioUrl),
    options,
    versionNumber: version?.versionNumber || 1,
    publishedAt: version?.publishedAt,
  };

  if (!publicOnly) {
    payload.versions = (question.versions || []).map((item: any) => ({
      id: item.id,
      versionNumber: item.versionNumber,
      prompt: item.prompt,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
    }));
  }

  return payload;
}

export function gradeAnswer(params: {
  typeCode: string;
  options?: OptionLike[];
  correctAnswerJson?: Record<string, unknown>;
  answerJson?: Record<string, unknown>;
}) {
  const answer = asRecord(params.answerJson);
  const correct = deriveCorrectAnswer(
    params.typeCode,
    params.options || [],
    params.correctAnswerJson,
  );

  if (params.typeCode === enumData.QUESTION_TYPE_CODE.SINGLE_CHOICE.code) {
    const selected = String(answer.optionKey || answer.selected || '');
    return {
      isCorrect: Boolean(selected) && selected === String(correct.optionKey || ''),
      correctAnswerJson: correct,
    };
  }

  if (params.typeCode === enumData.QUESTION_TYPE_CODE.MULTI_CHOICE.code) {
    const selected = uniqueKeys(
      Array.isArray(answer.optionKeys)
        ? (answer.optionKeys as unknown[]).map(item => String(item))
        : String(answer.optionKey || '')
          ? [String(answer.optionKey)]
          : [],
    ).sort();
    const expected = uniqueKeys(
      Array.isArray(correct.optionKeys) ? (correct.optionKeys as string[]) : [],
    ).sort();
    return {
      isCorrect: selected.length > 0 && selected.join('|') === expected.join('|'),
      correctAnswerJson: correct,
    };
  }

  if (params.typeCode === enumData.QUESTION_TYPE_CODE.TRUE_FALSE_NG.code) {
    const selected = String(answer.value || answer.optionKey || '').toUpperCase();
    const expected = String(correct.value || correct.optionKey || '').toUpperCase();
    return { isCorrect: Boolean(selected) && selected === expected, correctAnswerJson: correct };
  }

  if (params.typeCode === enumData.QUESTION_TYPE_CODE.FILL_BLANK.code) {
    const selected = Array.isArray(answer.blanks)
      ? (answer.blanks as unknown[]).map(normalizeText)
      : [normalizeText(answer.value || answer.text)];
    const expected = Array.isArray(correct.blanks)
      ? (correct.blanks as unknown[]).map(normalizeText)
      : [normalizeText(correct.value || correct.text)];
    return {
      isCorrect:
        selected.length === expected.length &&
        selected.every((item, index) => item && item === expected[index]),
      correctAnswerJson: correct,
    };
  }

  if (params.typeCode === enumData.QUESTION_TYPE_CODE.MATCHING.code) {
    const selected = asRecord(answer.pairs || answer);
    const expected = asRecord(correct.pairs || correct);
    const keys = Object.keys(expected);
    const isCorrect =
      keys.length > 0 &&
      keys.every(key => normalizeText(selected[key]) === normalizeText(expected[key]));
    return { isCorrect, correctAnswerJson: correct };
  }

  return { isCorrect: false, correctAnswerJson: correct, manual: true };
}

export function defaultAnswerSchema(code: string): Record<string, unknown> {
  if (code === enumData.QUESTION_TYPE_CODE.MULTI_CHOICE.code) {
    return { type: 'object', required: ['optionKeys'], properties: { optionKeys: { type: 'array' } } };
  }
  if (code === enumData.QUESTION_TYPE_CODE.FILL_BLANK.code) {
    return { type: 'object', required: ['blanks'], properties: { blanks: { type: 'array' } } };
  }
  if (code === enumData.QUESTION_TYPE_CODE.MATCHING.code) {
    return { type: 'object', required: ['pairs'], properties: { pairs: { type: 'object' } } };
  }
  if (code === enumData.QUESTION_TYPE_CODE.TRUE_FALSE_NG.code) {
    return { type: 'object', required: ['value'], properties: { value: { type: 'string' } } };
  }
  if (
    code === enumData.QUESTION_TYPE_CODE.ESSAY.code ||
    code === enumData.QUESTION_TYPE_CODE.AUDIO_RECORD.code
  ) {
    return { type: 'object', properties: { text: { type: 'string' } } };
  }
  return { type: 'object', required: ['optionKey'], properties: { optionKey: { type: 'string' } } };
}
