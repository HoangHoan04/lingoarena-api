import { DataSource } from 'typeorm';

const EXAM_TYPES = [
  { code: 'TOEIC', name: 'TOEIC', scoreMax: 990, sortOrder: 1 },
  { code: 'IELTS', name: 'IELTS', scoreMax: 9, sortOrder: 2 },
  { code: 'VSTEP', name: 'VSTEP', scoreMax: 10, sortOrder: 3 },
  { code: 'GENERAL', name: 'General English', scoreMax: 100, sortOrder: 4 },
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

export async function seedExam(ds: DataSource) {
  const examTypeIds = new Map<string, string>();
  for (const exam of EXAM_TYPES) {
    const id = await ensureId(
      ds,
      'exam_types',
      `code = $1 AND "isDeleted" = false`,
      [exam.code],
      `INSERT INTO exam_types (code, name, "scoreMin", "scoreMax", "scoreStep", "isActive", "sortOrder", "isDeleted", version, "createdAt")
       VALUES ($1,$2,0,$3,1,true,$4,false,0,NOW()) RETURNING id`,
      [exam.code, exam.name, exam.scoreMax, exam.sortOrder],
    );
    examTypeIds.set(exam.code, id);
  }

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

    for (const section of skill.sections) {
      await ensureId(
        ds,
        'exam_sections',
        `"examSkillId" = $1 AND code = $2 AND "isDeleted" = false`,
        [skillId, section.code],
        `INSERT INTO exam_sections ("examSkillId", code, name, "questionCount", "sortOrder", "isDeleted", version, "createdAt")
         VALUES ($1,$2,$3,$4,$5,false,0,NOW()) RETURNING id`,
        [skillId, section.code, section.name, section.questionCount, section.sortOrder],
      );
    }
  }

  console.log(`Seeded ${EXAM_TYPES.length} exam types with skills/sections.`);
}
