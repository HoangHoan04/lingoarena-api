import { hash } from 'bcrypt';
import { PWD_SALT_ROUNDS } from '../common/constants';
import { enumData } from '../common/enums/base.enum';
import { dataSource } from '../typeorm/typeorm.config';

async function ensureRole() {
  const existing = await dataSource.query(`SELECT id FROM roles WHERE code = $1 AND "isDeleted" = false LIMIT 1`, [
    enumData.USER_ROLE.STUDENT.code,
  ]);
  if (existing[0]?.id) return existing[0].id as string;
  const inserted = await dataSource.query(
    `INSERT INTO roles (code, name, description, "isSystem", "isDeleted", version, "createdAt")
     VALUES ($1, $2, $3, true, false, 0, NOW()) RETURNING id`,
    [enumData.USER_ROLE.STUDENT.code, enumData.USER_ROLE.STUDENT.name, 'Vai trò học viên'],
  );
  return inserted[0].id as string;
}

export async function seedArena() {
  const roleId = await ensureRole();
  const passwordHash = await hash('Bot@123456', PWD_SALT_ROUNDS);
  const existing = await dataSource.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND "isDeleted" = false LIMIT 1`, [
    'bot@lingoarena.com',
  ]);
  let userId = existing[0]?.id as string | undefined;
  if (!userId) {
    const inserted = await dataSource.query(
      `INSERT INTO users (email, username, "passwordHash", status, "emailVerifiedAt", "preferredLanguage", timezone, "isDeleted", version, "createdAt")
       VALUES ($1, $2, $3, $4, NOW(), 'vi', 'Asia/Ho_Chi_Minh', false, 0, NOW()) RETURNING id`,
      ['bot@lingoarena.com', 'bot', passwordHash, enumData.USER_STATUS.ACTIVE.code],
    );
    userId = inserted[0].id;
  } else {
    await dataSource.query(`UPDATE users SET username = $2, "passwordHash" = $3, status = $4 WHERE id = $1`, [
      userId,
      'bot',
      passwordHash,
      enumData.USER_STATUS.ACTIVE.code,
    ]);
  }

  const userRole = await dataSource.query(
    `SELECT id FROM user_roles WHERE "userId" = $1 AND "roleId" = $2 AND "isDeleted" = false LIMIT 1`,
    [userId, roleId],
  );
  if (!userRole[0]) {
    await dataSource.query(
      `INSERT INTO user_roles ("userId", "roleId", "scopeType", "isDeleted", version, "createdAt")
       VALUES ($1, $2, $3, false, 0, NOW())`,
      [userId, roleId, enumData.SCOPE_TYPE.GLOBAL.code],
    );
  }
}

async function run() {
  await dataSource.initialize();
  try {
    await seedArena();
    console.log('Arena seed completed');
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
