import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '../common/enums/base.enum';

export async function seedGrammar(dataSource: DataSource) {
  const existingTopic = await dataSource.query(
    `SELECT id FROM grammar_topics WHERE slug = $1 AND "isDeleted" = false LIMIT 1`,
    ['present-simple'],
  );

  const topicId =
    existingTopic[0]?.id ||
    (
      await dataSource.query(
        `INSERT INTO grammar_topics
          (id, title, slug, "cefrLevel", description, "sortOrder", "isDeleted", version, "createdAt")
         VALUES ($1,$2,$3,$4,$5,1,false,0,NOW())
         RETURNING id`,
        [
          uuidv4(),
          'Present Simple',
          'present-simple',
          enumData.CEFR_LEVEL.A1.code,
          'Basic usage of the present simple tense.',
        ],
      )
    )[0].id;

  const existingStructure = await dataSource.query(
    `SELECT id FROM grammar_structures
     WHERE "grammarTopicId" = $1 AND title = $2 AND "isDeleted" = false
     LIMIT 1`,
    [topicId, 'Present Simple: habits and facts'],
  );

  const structureId =
    existingStructure[0]?.id ||
    (
      await dataSource.query(
        `INSERT INTO grammar_structures
          (id, "grammarTopicId", title, formula, "meaningVi", "usageContent", status, "isDeleted", version, "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,false,0,NOW())
         RETURNING id`,
        [
          uuidv4(),
          topicId,
          'Present Simple: habits and facts',
          'S + V(s/es) + O',
          'Diễn tả thói quen, lịch trình hoặc sự thật hiển nhiên.',
          'Use the present simple for routines, repeated actions, timetables, and general truths.',
          enumData.CONTENT_REVIEW_STATUS.APPROVED.code,
        ],
      )
    )[0].id;

  const examples = [
    {
      sentence: 'She studies English every evening.',
      translation: 'Cô ấy học tiếng Anh mỗi tối.',
      explanation: 'A repeated habit uses the present simple.',
      sortOrder: 1,
    },
    {
      sentence: 'The sun rises in the east.',
      translation: 'Mặt trời mọc ở hướng đông.',
      explanation: 'A general truth uses the present simple.',
      sortOrder: 2,
    },
  ];

  for (const example of examples) {
    const existingExample = await dataSource.query(
      `SELECT id FROM grammar_examples
       WHERE "grammarStructureId" = $1 AND sentence = $2 AND "isDeleted" = false
       LIMIT 1`,
      [structureId, example.sentence],
    );
    if (existingExample[0]?.id) continue;
    await dataSource.query(
      `INSERT INTO grammar_examples
        (id, "grammarStructureId", sentence, translation, explanation, "isNegativeExample", "sortOrder", "isDeleted", version, "createdAt")
       VALUES ($1,$2,$3,$4,$5,false,$6,false,0,NOW())`,
      [
        uuidv4(),
        structureId,
        example.sentence,
        example.translation,
        example.explanation,
        example.sortOrder,
      ],
    );
  }

  console.log('Seeded grammar topic Present Simple.');
}
