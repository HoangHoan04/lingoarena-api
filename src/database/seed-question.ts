import { DataSource } from 'typeorm';
import { enumData } from '../common/enums/base.enum';
import { defaultAnswerSchema } from '../modules/question/helpers';

const QUESTION_TYPES = [
  {
    code: enumData.QUESTION_TYPE_CODE.SINGLE_CHOICE.code,
    name: enumData.QUESTION_TYPE_CODE.SINGLE_CHOICE.name,
    gradingStrategy: enumData.GRADING_STRATEGY.EXACT_MATCH.code,
    supportsAutoGrading: true,
  },
  {
    code: enumData.QUESTION_TYPE_CODE.MULTI_CHOICE.code,
    name: enumData.QUESTION_TYPE_CODE.MULTI_CHOICE.name,
    gradingStrategy: enumData.GRADING_STRATEGY.EXACT_MATCH.code,
    supportsAutoGrading: true,
  },
  {
    code: enumData.QUESTION_TYPE_CODE.TRUE_FALSE_NG.code,
    name: enumData.QUESTION_TYPE_CODE.TRUE_FALSE_NG.name,
    gradingStrategy: enumData.GRADING_STRATEGY.EXACT_MATCH.code,
    supportsAutoGrading: true,
  },
  {
    code: enumData.QUESTION_TYPE_CODE.FILL_BLANK.code,
    name: enumData.QUESTION_TYPE_CODE.FILL_BLANK.name,
    gradingStrategy: enumData.GRADING_STRATEGY.EXACT_MATCH.code,
    supportsAutoGrading: true,
  },
  {
    code: enumData.QUESTION_TYPE_CODE.MATCHING.code,
    name: enumData.QUESTION_TYPE_CODE.MATCHING.name,
    gradingStrategy: enumData.GRADING_STRATEGY.EXACT_MATCH.code,
    supportsAutoGrading: true,
  },
  {
    code: enumData.QUESTION_TYPE_CODE.ESSAY.code,
    name: enumData.QUESTION_TYPE_CODE.ESSAY.name,
    gradingStrategy: enumData.GRADING_STRATEGY.RUBRIC_MANUAL.code,
    supportsAutoGrading: false,
  },
  {
    code: enumData.QUESTION_TYPE_CODE.AUDIO_RECORD.code,
    name: enumData.QUESTION_TYPE_CODE.AUDIO_RECORD.name,
    gradingStrategy: enumData.GRADING_STRATEGY.AI_ASSISTED.code,
    supportsAutoGrading: false,
  },
];

const SKILLS: Array<{
  exam: string;
  code: string;
  name: string;
  durationSeconds: number;
  sortOrder: number;
  sections: Array<{ code: string; name: string; questionCount: number; sortOrder: number }>;
}> = [
  {
    exam: 'TOEIC',
    code: 'LISTENING',
    name: 'Listening',
    durationSeconds: 2700,
    sortOrder: 1,
    sections: [
      { code: 'PART_1', name: 'Part 1 Photographs', questionCount: 6, sortOrder: 1 },
      { code: 'PART_2', name: 'Part 2 Question-Response', questionCount: 25, sortOrder: 2 },
      { code: 'PART_3', name: 'Part 3 Conversations', questionCount: 39, sortOrder: 3 },
      { code: 'PART_4', name: 'Part 4 Talks', questionCount: 30, sortOrder: 4 },
    ],
  },
  {
    exam: 'TOEIC',
    code: 'READING',
    name: 'Reading',
    durationSeconds: 4500,
    sortOrder: 2,
    sections: [
      { code: 'PART_5', name: 'Part 5 Incomplete Sentences', questionCount: 30, sortOrder: 1 },
      { code: 'PART_6', name: 'Part 6 Text Completion', questionCount: 16, sortOrder: 2 },
      { code: 'PART_7', name: 'Part 7 Reading Comprehension', questionCount: 54, sortOrder: 3 },
    ],
  },
  {
    exam: 'IELTS',
    code: 'LISTENING',
    name: 'Listening',
    durationSeconds: 1800,
    sortOrder: 1,
    sections: [{ code: 'SECTION_1', name: 'Section 1', questionCount: 10, sortOrder: 1 }],
  },
  {
    exam: 'IELTS',
    code: 'READING',
    name: 'Reading',
    durationSeconds: 3600,
    sortOrder: 2,
    sections: [{ code: 'PASSAGE_1', name: 'Passage 1', questionCount: 13, sortOrder: 1 }],
  },
  {
    exam: 'IELTS',
    code: 'WRITING',
    name: 'Writing',
    durationSeconds: 3600,
    sortOrder: 3,
    sections: [{ code: 'TASK_1', name: 'Task 1', questionCount: 1, sortOrder: 1 }],
  },
  {
    exam: 'IELTS',
    code: 'SPEAKING',
    name: 'Speaking',
    durationSeconds: 840,
    sortOrder: 4,
    sections: [{ code: 'PART_1', name: 'Part 1', questionCount: 1, sortOrder: 1 }],
  },
  {
    exam: 'GENERAL',
    code: 'GRAMMAR_VOCAB',
    name: 'Grammar & Vocabulary',
    durationSeconds: 1200,
    sortOrder: 1,
    sections: [{ code: 'MIXED', name: 'Mixed practice', questionCount: 20, sortOrder: 1 }],
  },
];

const SAMPLE_QUESTIONS = [
  {
    prompt: 'The manager asked all staff to ________ their reports before Friday.',
    explanation: '"Submit" is the correct verb collocating with reports.',
    options: [
      { optionKey: 'A', content: 'submit', isCorrect: true },
      { optionKey: 'B', content: 'submitting', isCorrect: false },
      { optionKey: 'C', content: 'submission', isCorrect: false },
      { optionKey: 'D', content: 'submitted', isCorrect: false },
    ],
  },
  {
    prompt: 'Due to the delay, the shipment will not ________ until next week.',
    explanation: '"Arrive" is the intransitive verb that fits the context.',
    options: [
      { optionKey: 'A', content: 'arrive', isCorrect: true },
      { optionKey: 'B', content: 'arrival', isCorrect: false },
      { optionKey: 'C', content: 'arriving', isCorrect: false },
      { optionKey: 'D', content: 'arrived', isCorrect: false },
    ],
  },
  {
    prompt: 'Please ________ the attached invoice and confirm the total amount.',
    explanation: '"Review" is the appropriate verb for checking a document.',
    options: [
      { optionKey: 'A', content: 'review', isCorrect: true },
      { optionKey: 'B', content: 'revise', isCorrect: false },
      { optionKey: 'C', content: 'remain', isCorrect: false },
      { optionKey: 'D', content: 'remove', isCorrect: false },
    ],
  },
  {
    prompt: 'The new policy will be ________ next month after the board meeting.',
    explanation: '"Implemented" means put into effect.',
    options: [
      { optionKey: 'A', content: 'implemented', isCorrect: true },
      { optionKey: 'B', content: 'implementation', isCorrect: false },
      { optionKey: 'C', content: 'implementing', isCorrect: false },
      { optionKey: 'D', content: 'implement', isCorrect: false },
    ],
  },
  {
    prompt: 'Employees are advised to keep their workstations ________ at the end of the day.',
    explanation: '"Tidy" is the adjective describing a clean workstation.',
    options: [
      { optionKey: 'A', content: 'tidy', isCorrect: true },
      { optionKey: 'B', content: 'tidily', isCorrect: false },
      { optionKey: 'C', content: 'tidiness', isCorrect: false },
      { optionKey: 'D', content: 'tidied', isCorrect: false },
    ],
  },
];

async function ensureId(
  ds: DataSource,
  table: string,
  whereSql: string,
  whereParams: any[],
  insertSql: string,
  insertParams: any[],
) {
  const existing = await ds.query(`SELECT id FROM ${table} WHERE ${whereSql} LIMIT 1`, whereParams);
  if (existing[0]?.id) return existing[0].id as string;
  const inserted = await ds.query(insertSql, insertParams);
  return inserted[0].id as string;
}

export async function seedQuestion(ds: DataSource) {
  const examRows = await ds.query(
    `SELECT id, code FROM exam_types WHERE "isDeleted" = false`,
  );
  const examTypeIds = new Map<string, string>(
    examRows.map((row: { id: string; code: string }) => [row.code, row.id]),
  );

  const skillIds = new Map<string, string>();
  const sectionIds = new Map<string, string>();

  for (const skill of SKILLS) {
    const examTypeId = examTypeIds.get(skill.exam);
    if (!examTypeId) continue;
    const skillId = await ensureId(
      ds,
      'exam_skills',
      `"examTypeId" = $1 AND code = $2 AND "isDeleted" = false`,
      [examTypeId, skill.code],
      `INSERT INTO exam_skills ("examTypeId", code, name, "durationSeconds", "sortOrder", "isDeleted", version, "createdAt")
       VALUES ($1,$2,$3,$4,$5,false,0,NOW()) RETURNING id`,
      [examTypeId, skill.code, skill.name, skill.durationSeconds, skill.sortOrder],
    );
    skillIds.set(`${skill.exam}:${skill.code}`, skillId);

    for (const section of skill.sections) {
      const sectionId = await ensureId(
        ds,
        'exam_sections',
        `"examSkillId" = $1 AND code = $2 AND "isDeleted" = false`,
        [skillId, section.code],
        `INSERT INTO exam_sections ("examSkillId", code, name, "questionCount", "sortOrder", "isDeleted", version, "createdAt")
         VALUES ($1,$2,$3,$4,$5,false,0,NOW()) RETURNING id`,
        [skillId, section.code, section.name, section.questionCount, section.sortOrder],
      );
      sectionIds.set(`${skill.exam}:${skill.code}:${section.code}`, sectionId);
    }
  }

  const typeIds = new Map<string, string>();
  for (const type of QUESTION_TYPES) {
    const typeId = await ensureId(
      ds,
      'question_types',
      `code = $1 AND "isDeleted" = false`,
      [type.code],
      `INSERT INTO question_types (code, name, "answerSchema", "gradingStrategy", "supportsAutoGrading", "isDeleted", version, "createdAt")
       VALUES ($1,$2,$3::jsonb,$4,$5,false,0,NOW()) RETURNING id`,
      [
        type.code,
        type.name,
        JSON.stringify(defaultAnswerSchema(type.code)),
        type.gradingStrategy,
        type.supportsAutoGrading,
      ],
    );
    typeIds.set(type.code, typeId);
  }

  const topic = await ds.query(
    `SELECT id FROM topics WHERE code = 'BUSINESS' AND "isDeleted" = false LIMIT 1`,
  );
  const topicId = topic[0]?.id as string | undefined;
  const examTypeId = examTypeIds.get('TOEIC');
  const examSkillId = skillIds.get('TOEIC:READING');
  const examSectionId = sectionIds.get('TOEIC:READING:PART_5');
  const questionTypeId = typeIds.get(enumData.QUESTION_TYPE_CODE.SINGLE_CHOICE.code);

  if (!examTypeId || !examSkillId || !examSectionId || !questionTypeId) {
    console.log('Question seed skipped sample items (missing exam/type).');
    return;
  }

  for (const sample of SAMPLE_QUESTIONS) {
    const exist = await ds.query(
      `SELECT q.id FROM questions q
       INNER JOIN question_versions v ON v.id = q."currentVersionId"
       WHERE v.prompt = $1 AND q."isDeleted" = false LIMIT 1`,
      [sample.prompt],
    );
    if (exist[0]?.id) continue;

    const question = await ds.query(
      `INSERT INTO questions
        ("examTypeId","examSkillId","examSectionId","questionTypeId","difficultyLevel","cefrLevel","defaultPoints",status,"isDeleted",version,"createdAt")
       VALUES ($1,$2,$3,$4,2,'B1',1,$5,false,0,NOW()) RETURNING id`,
      [examTypeId, examSkillId, examSectionId, questionTypeId, enumData.CONTENT_REVIEW_STATUS.APPROVED.code],
    );
    const questionId = question[0].id as string;
    const correct = { optionKey: sample.options.find(item => item.isCorrect)?.optionKey };
    const version = await ds.query(
      `INSERT INTO question_versions
        ("questionId","versionNumber",prompt,explanation,"correctAnswerJson","publishedAt","isDeleted",version,"createdAt")
       VALUES ($1,1,$2,$3,$4::jsonb,NOW(),false,0,NOW()) RETURNING id`,
      [questionId, sample.prompt, sample.explanation, JSON.stringify(correct)],
    );
    const versionId = version[0].id as string;
    await ds.query(`UPDATE questions SET "currentVersionId" = $2 WHERE id = $1`, [
      questionId,
      versionId,
    ]);

    for (const [index, option] of sample.options.entries()) {
      await ds.query(
        `INSERT INTO question_options
          ("questionVersionId","optionKey",content,"isCorrect","sortOrder","isDeleted",version,"createdAt")
         VALUES ($1,$2,$3,$4,$5,false,0,NOW())`,
        [versionId, option.optionKey, option.content, option.isCorrect, index],
      );
    }

    if (topicId) {
      await ds.query(
        `INSERT INTO question_topics ("questionId","topicId","isDeleted",version,"createdAt")
         VALUES ($1,$2,false,0,NOW())`,
        [questionId, topicId],
      );
    }
  }

  const matchingTypeId = typeIds.get(enumData.QUESTION_TYPE_CODE.MATCHING.code);
  if (matchingTypeId) {
    const matchingPrompt = 'Match each verb with the closest meaning.';
    const matchingExist = await ds.query(
      `SELECT q.id FROM questions q
       INNER JOIN question_versions v ON v.id = q."currentVersionId"
       WHERE v.prompt = $1 AND q."isDeleted" = false LIMIT 1`,
      [matchingPrompt],
    );
    if (!matchingExist[0]?.id) {
      const matchingQuestion = await ds.query(
        `INSERT INTO questions
          ("examTypeId","examSkillId","examSectionId","questionTypeId","difficultyLevel","cefrLevel","defaultPoints",status,"isDeleted",version,"createdAt")
         VALUES ($1,$2,$3,$4,2,'B1',1,$5,false,0,NOW()) RETURNING id`,
        [examTypeId, examSkillId, examSectionId, matchingTypeId, enumData.CONTENT_REVIEW_STATUS.APPROVED.code],
      );
      const matchingId = matchingQuestion[0].id as string;
      const contentJson = {
        left: [
          { key: '1', content: 'increase' },
          { key: '2', content: 'decrease' },
        ],
        right: [
          { key: 'A', content: 'go up' },
          { key: 'B', content: 'go down' },
        ],
      };
      const correct = { pairs: { '1': 'A', '2': 'B' } };
      const matchingVersion = await ds.query(
        `INSERT INTO question_versions
          ("questionId","versionNumber",prompt,explanation,"contentJson","correctAnswerJson","publishedAt","isDeleted",version,"createdAt")
         VALUES ($1,1,$2,$3,$4::jsonb,$5::jsonb,NOW(),false,0,NOW()) RETURNING id`,
        [
          matchingId,
          matchingPrompt,
          'Increase means go up; decrease means go down.',
          JSON.stringify(contentJson),
          JSON.stringify(correct),
        ],
      );
      await ds.query(`UPDATE questions SET "currentVersionId" = $2 WHERE id = $1`, [
        matchingId,
        matchingVersion[0].id,
      ]);
      if (topicId) {
        await ds.query(
          `INSERT INTO question_topics ("questionId","topicId","isDeleted",version,"createdAt")
           VALUES ($1,$2,false,0,NOW())`,
          [matchingId, topicId],
        );
      }
    }
  }

  console.log(
    `Seeded ${QUESTION_TYPES.length} question types, exam skills/sections, and ${SAMPLE_QUESTIONS.length} sample questions.`,
  );
}
