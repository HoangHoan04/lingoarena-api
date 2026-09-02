import { DataSource } from 'typeorm';
import { enumData } from '../common/enums/base.enum';

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

export async function seedCourse(ds: DataSource) {
  const examType = await ds.query(
    `SELECT id FROM exam_types WHERE code = $1 AND "isDeleted" = false LIMIT 1`,
    ['TOEIC'],
  );
  const examTypeId = examType[0]?.id || null;

  const courseId = await ensureId(
    ds,
    'courses',
    `code = $1 AND "isDeleted" = false`,
    ['COURSE-TOEIC-FREE'],
    `INSERT INTO courses (
       "examTypeId", code, slug, title, "shortDescription", description,
       "thumbnailUrl", "levelFrom", "levelTo", "estimatedMinutes", status,
       visibility, "publishedAt", "isDeleted", version, "createdAt"
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),false,0,NOW())
     RETURNING id`,
    [
      examTypeId,
      'COURSE-TOEIC-FREE',
      'toeic-starter',
      'TOEIC Starter miễn phí',
      'Khóa học TOEIC nhập môn miễn phí cho học viên mới.',
      'Làm quen lộ trình học TOEIC cùng LingoArena.',
      null,
      enumData.CEFR_LEVEL.A1.code,
      enumData.CEFR_LEVEL.C1.code,
      15,
      enumData.COURSE_STATUS.PUBLISHED.code,
      enumData.VISIBILITY.PUBLIC.code,
    ],
  );

  const versionId = await ensureId(
    ds,
    'course_versions',
    `"courseId" = $1 AND "versionNumber" = 1 AND "isDeleted" = false`,
    [courseId],
    `INSERT INTO course_versions (
       "courseId", "versionNumber", "changeNote", status, "publishedAt",
       "isDeleted", version, "createdAt"
     )
     VALUES ($1,1,$2,$3,NOW(),false,0,NOW())
     RETURNING id`,
    [courseId, 'Phiên bản khởi tạo', enumData.COURSE_STATUS.PUBLISHED.code],
  );

  const sectionId = await ensureId(
    ds,
    'course_sections',
    `"courseVersionId" = $1 AND title = $2 AND "isDeleted" = false`,
    [versionId, 'Bài 1'],
    `INSERT INTO course_sections (
       "courseVersionId", title, description, "sortOrder", "isDeleted", version, "createdAt"
     )
     VALUES ($1,$2,$3,1,false,0,NOW())
     RETURNING id`,
    [versionId, 'Bài 1', 'Làm quen khóa học TOEIC Starter'],
  );

  const lessonId = await ensureId(
    ds,
    'lessons',
    `"courseSectionId" = $1 AND title = $2 AND "isDeleted" = false`,
    [sectionId, 'Chào mừng đến với TOEIC Starter'],
    `INSERT INTO lessons (
       "courseSectionId", title, "lessonType", "estimatedMinutes", "isPreview",
       "sortOrder", status, "isDeleted", version, "createdAt"
     )
     VALUES ($1,$2,$3,15,true,1,$4,false,0,NOW())
     RETURNING id`,
    [
      sectionId,
      'Chào mừng đến với TOEIC Starter',
      enumData.LESSON_TYPE.LECTURE.code,
      enumData.LESSON_STATUS.PUBLISHED.code,
    ],
  );

  await ensureId(
    ds,
    'lesson_blocks',
    `"lessonId" = $1 AND "blockType" = $2 AND "sortOrder" = 1 AND "isDeleted" = false`,
    [lessonId, enumData.LESSON_BLOCK_TYPE.TEXT.code],
    `INSERT INTO lesson_blocks (
       "lessonId", "blockType", "contentJson", "mediaAssetId", "sortOrder",
       "isRequired", "isDeleted", version, "createdAt"
     )
     VALUES ($1,$2,$3::jsonb,NULL,1,true,false,0,NOW())
     RETURNING id`,
    [
      lessonId,
      enumData.LESSON_BLOCK_TYPE.TEXT.code,
      JSON.stringify({ html: 'Chào mừng bạn đến với khóa TOEIC Starter miễn phí của LingoArena.' }),
    ],
  );

  console.log('Seeded COURSE-TOEIC-FREE course.');
}
