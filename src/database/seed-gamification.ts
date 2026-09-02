import { enumData } from '../common/enums/base.enum';
import { dataSource } from '../typeorm/typeorm.config';

export async function seedGamification() {
  const existing = await dataSource.query(`SELECT id FROM daily_challenges WHERE code = $1 AND "isDeleted" = false LIMIT 1`, [
    'PRACTICE_10',
  ]);
  if (existing[0]?.id) {
    await dataSource.query(
      `UPDATE daily_challenges
       SET title = $2, description = $3, "challengeType" = $4, "targetCount" = 10, "rewardPoints" = 50, "isActive" = true
       WHERE id = $1`,
      [
        existing[0].id,
        'Hoàn thành 10 câu luyện tập',
        'Luyện 10 câu hỏi bất kỳ trong ngày để nhận điểm thưởng.',
        enumData.DAILY_CHALLENGE_TYPE.ASSESSMENT.code,
      ],
    );
    return existing[0].id as string;
  }

  const inserted = await dataSource.query(
    `INSERT INTO daily_challenges (code, title, description, "challengeType", "targetCount", "rewardPoints", "isActive", "isDeleted", version, "createdAt")
     VALUES ($1, $2, $3, $4, 10, 50, true, false, 0, NOW()) RETURNING id`,
    [
      'PRACTICE_10',
      'Hoàn thành 10 câu luyện tập',
      'Luyện 10 câu hỏi bất kỳ trong ngày để nhận điểm thưởng.',
      enumData.DAILY_CHALLENGE_TYPE.ASSESSMENT.code,
    ],
  );
  return inserted[0].id as string;
}

async function run() {
  await dataSource.initialize();
  try {
    await seedGamification();
    console.log('Gamification seed completed');
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  run().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
