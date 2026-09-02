import { DataSource } from 'typeorm';
import { enumData } from '../common/enums/base.enum';

type AssessmentSeed = {
  slug: string;
  title: string;
  assessmentType: string;
  durationSeconds: number;
  limit: number;
};

const SEEDS: AssessmentSeed[] = [
  {
    slug: 'toeic-mini-part5',
    title: 'TOEIC Mini Part 5',
    assessmentType: enumData.ASSESSMENT_TYPE.MINI_TEST.code,
    durationSeconds: 600,
    limit: 15,
  },
  {
    slug: 'placement-toeic',
    title: 'TOEIC Placement Test',
    assessmentType: enumData.ASSESSMENT_TYPE.PLACEMENT_TEST.code,
    durationSeconds: 600,
    limit: 10,
  },
];

async function ensureAssessment(ds: DataSource, seed: AssessmentSeed, examTypeId: string) {
  const existing = await ds.query(`SELECT id FROM assessments WHERE slug = $1 LIMIT 1`, [seed.slug]);
  if (existing[0]?.id) {
    await ds.query(
      `UPDATE assessments
       SET title = $2,
           "examTypeId" = $3,
           "assessmentType" = $4,
           "durationSeconds" = $5,
           "isFree" = true,
           status = $6,
           "isDeleted" = false
       WHERE id = $1`,
      [
        existing[0].id,
        seed.title,
        examTypeId,
        seed.assessmentType,
        seed.durationSeconds,
        enumData.ASSESSMENT_STATUS.PUBLISHED.code,
      ],
    );
    return existing[0].id as string;
  }

  const inserted = await ds.query(
    `INSERT INTO assessments
      ("examTypeId","assessmentType",title,slug,description,"durationSeconds","maxAttempts","selectionMode","showAnswersPolicy",status,"isFree","isDeleted",version,"createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,$9,true,false,0,NOW())
     RETURNING id`,
    [
      examTypeId,
      seed.assessmentType,
      seed.title,
      seed.slug,
      'Đề mẫu miễn phí được tạo từ ngân hàng câu hỏi đã duyệt.',
      seed.durationSeconds,
      enumData.SELECTION_MODE.FIXED.code,
      enumData.SHOW_ANSWERS_POLICY.AFTER_SUBMISSION.code,
      enumData.ASSESSMENT_STATUS.PUBLISHED.code,
    ],
  );
  return inserted[0].id as string;
}

async function ensureSection(ds: DataSource, assessmentId: string, examSkillId: string, title: string) {
  const existing = await ds.query(
    `SELECT id FROM assessment_sections WHERE "assessmentId" = $1 AND "isDeleted" = false ORDER BY "sortOrder" ASC LIMIT 1`,
    [assessmentId],
  );
  if (existing[0]?.id) return existing[0].id as string;

  const inserted = await ds.query(
    `INSERT INTO assessment_sections
      ("assessmentId","examSkillId",title,instructions,"durationSeconds","sortOrder","isDeleted",version,"createdAt")
     VALUES ($1,$2,$3,$4,NULL,0,false,0,NOW())
     RETURNING id`,
    [assessmentId, examSkillId, title, 'Chọn đáp án đúng nhất cho mỗi câu hỏi.'],
  );
  return inserted[0].id as string;
}

export async function seedAssessment(ds: DataSource) {
  const toeic = await ds.query(
    `SELECT id FROM exam_types WHERE code = 'TOEIC' AND "isDeleted" = false LIMIT 1`,
  );
  const examTypeId = toeic[0]?.id as string | undefined;
  if (!examTypeId) {
    console.log('Assessment seed skipped (missing TOEIC exam type).');
    return;
  }

  const skill = await ds.query(
    `SELECT s.id
     FROM exam_skills s
     INNER JOIN exam_types t ON t.id = s."examTypeId"
     WHERE t.code = 'TOEIC' AND s."isDeleted" = false AND t."isDeleted" = false
     ORDER BY s."sortOrder" ASC, s."createdAt" ASC
     LIMIT 1`,
  );
  const examSkillId = skill[0]?.id as string | undefined;
  if (!examSkillId) {
    console.log('Assessment seed skipped (missing TOEIC exam skill).');
    return;
  }

  const questionRows = await ds.query(
    `SELECT q.id, q."currentVersionId", q."defaultPoints"
     FROM questions q
     WHERE q."examTypeId" = $1
       AND q.status = $2
       AND q."currentVersionId" IS NOT NULL
       AND q."isDeleted" = false
     ORDER BY q."createdAt" ASC
     LIMIT 15`,
    [examTypeId, enumData.CONTENT_REVIEW_STATUS.APPROVED.code],
  );

  for (const seed of SEEDS) {
    const assessmentId = await ensureAssessment(ds, seed, examTypeId);
    const sectionId = await ensureSection(ds, assessmentId, examSkillId, seed.title);
    for (const [index, question] of questionRows.slice(0, seed.limit).entries()) {
      const exists = await ds.query(
        `SELECT id FROM assessment_items
         WHERE "assessmentSectionId" = $1 AND "questionId" = $2 AND "isDeleted" = false
         LIMIT 1`,
        [sectionId, question.id],
      );
      if (exists[0]?.id) continue;
      await ds.query(
        `INSERT INTO assessment_items
          ("assessmentSectionId","questionId","questionVersionId",points,"sortOrder","isRequired","isDeleted",version,"createdAt")
         VALUES ($1,$2,$3,$4,$5,true,false,0,NOW())`,
        [sectionId, question.id, question.currentVersionId, Number(question.defaultPoints || 1), index],
      );
    }
  }

  console.log('Assessment seed completed.');
}
