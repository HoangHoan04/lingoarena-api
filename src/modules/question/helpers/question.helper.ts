import { enumData } from '~/common/enums/base.enum';

export const AUTO_GRADE_TYPES: string[] = [
  enumData.QUESTION_TYPE_CODE.SINGLE_CHOICE.code,
  enumData.QUESTION_TYPE_CODE.MULTI_CHOICE.code,
  enumData.QUESTION_TYPE_CODE.TRUE_FALSE_NG.code,
  enumData.QUESTION_TYPE_CODE.FILL_BLANK.code,
  enumData.QUESTION_TYPE_CODE.MATCHING.code,
];

export const QUESTION_ENTITY_TYPE = 'QuestionEntity';
export const QUESTION_TYPE_ENUM_LOCKED = 'Loại câu hỏi là enum, không còn bảng riêng';

type OptionLike = {
  id?: string;
  optionKey: string;
  content: string;
  isCorrect?: boolean;
  feedback?: string;
  sortOrder?: number;
};

type TaxonomyLinkLike = {
  taxonomyId?: string;
  taxonomy?: { id?: string; kind?: string; code?: string; name?: string; slug?: string };
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

export function slugify(raw: string): string {
  return (raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);
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

export function listQuestionTypes() {
  return Object.values(enumData.QUESTION_TYPE_CODE).map(item => {
    const supportsAutoGrading = AUTO_GRADE_TYPES.includes(item.code);
    return {
      id: item.code,
      code: item.code,
      name: item.name,
      value: item.code,
      label: item.name,
      gradingStrategy: supportsAutoGrading
        ? enumData.GRADING_STRATEGY.EXACT_MATCH.code
        : enumData.GRADING_STRATEGY.RUBRIC_MANUAL.code,
      supportsAutoGrading,
      answerSchema: defaultAnswerSchema(item.code),
    };
  });
}

export function questionTypeShape(code?: string | null) {
  if (!code) return null;
  return listQuestionTypes().find(item => item.code === code) || {
    id: code,
    code,
    name: code,
    value: code,
    label: code,
    gradingStrategy: enumData.GRADING_STRATEGY.EXACT_MATCH.code,
    supportsAutoGrading: AUTO_GRADE_TYPES.includes(code),
    answerSchema: defaultAnswerSchema(code),
  };
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
    const keys = uniqueKeys(options.filter(item => item.isCorrect).map(item => item.optionKey));
    if (keys.length) return { optionKeys: keys };
    const fromJson = Array.isArray(correctAnswerJson?.optionKeys)
      ? (correctAnswerJson?.optionKeys as unknown[]).map(item => String(item))
      : [];
    return { optionKeys: uniqueKeys(fromJson) };
  }
  return asRecord(correctAnswerJson);
}

function structureShape(item?: any) {
  if (!item) return null;
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    nodeType: item.nodeType,
    parentId: item.parentId,
    examTypeId: item.examTypeId,
  };
}

function splitTaxonomies(links: TaxonomyLinkLike[] = []) {
  const topics = links
    .filter(item => item.taxonomy?.kind === enumData.TAXONOMY_KIND.TOPIC.code)
    .map(item => ({
      id: item.taxonomy?.id,
      code: item.taxonomy?.code,
      name: item.taxonomy?.name,
      slug: item.taxonomy?.slug,
    }));
  const tags = links
    .filter(item => item.taxonomy?.kind === enumData.TAXONOMY_KIND.TAG.code)
    .map(item => ({
      id: item.taxonomy?.id,
      name: item.taxonomy?.name,
      slug: item.taxonomy?.slug,
    }));
  return { topics, tags };
}

export function buildQuestionPayload(question: any, publicOnly = false) {
  const contentJson = asRecord(question.contentJson);
  const typeShape = questionTypeShape(question.questionType);
  const structure = question.examStructure;
  const skill =
    structure?.nodeType === enumData.EXAM_NODE_TYPE.SKILL.code ? structure : structure?.parent;
  const section =
    structure && structure.nodeType !== enumData.EXAM_NODE_TYPE.SKILL.code ? structure : null;
  const { topics, tags } = splitTaxonomies(question.contentTaxonomies || []);
  const options = (question.options || [])
    .slice()
    .sort((a: OptionLike, b: OptionLike) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((item: OptionLike) => ({
      id: item.id,
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
    examStructureId: question.examStructureId,
    examSkillId: skill?.id || (structure?.nodeType === enumData.EXAM_NODE_TYPE.SKILL.code ? structure.id : null),
    examSectionId: section?.id || null,
    questionTypeId: question.questionType,
    questionTypeCode: question.questionType,
    difficultyLevel: question.difficultyLevel,
    cefrLevel: question.cefrLevel,
    defaultPoints: Number(question.defaultPoints || 1),
    gradingStrategy: question.gradingStrategy,
    questionNumber: question.questionNumber,
    isDeleted: question.isDeleted,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    examType: question.examType
      ? { id: question.examType.id, code: question.examType.code, name: question.examType.name }
      : null,
    examStructure: structureShape(structure),
    examSkill: structureShape(skill),
    examSection: structureShape(section),
    questionType: typeShape,
    questionGroup: question.questionGroup
      ? {
          id: question.questionGroup.id,
          title: question.questionGroup.title,
          instructions: question.questionGroup.instructions,
          stimulusType: question.questionGroup.stimulusType,
          passageText: question.questionGroup.passageText,
          summaryVi: question.questionGroup.summaryVi,
          youtubeId: question.questionGroup.youtubeId,
          coverImageUrl: question.questionGroup.coverImageUrl,
          thumbnailUrl: question.questionGroup.thumbnailUrl,
          imageUrl: question.questionGroup.coverImageUrl,
          audioUrl: question.questionGroup.audioUrl,
        }
      : null,
    topics,
    tags,
    topicIds: topics.map(item => item.id).filter(Boolean),
    tagIds: tags.map(item => item.id).filter(Boolean),
    prompt: question.prompt || '',
    instructions: question.instructions,
    explanation: publicOnly ? undefined : question.explanation,
    explanationEn: publicOnly ? undefined : question.explanationEn,
    contentJson: question.contentJson || null,
    correctAnswerJson: publicOnly ? undefined : question.correctAnswerJson,
    imageUrl: question.imageUrl || (typeof contentJson.imageUrl === 'string' ? contentJson.imageUrl : null),
    audioUrl: typeof contentJson.audioUrl === 'string' ? contentJson.audioUrl : null,
    options,
  };

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
