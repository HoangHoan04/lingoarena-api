import { hash } from 'bcrypt';
import { dataSource } from '../typeorm/typeorm.config';
import { PWD_SALT_ROUNDS } from '../common/constants';
import { enumData } from '../common/enums/base.enum';
import { seedArena } from './seed-arena';
import { seedAssessment } from './seed-assessment';
import { seedCommerce } from './seed-commerce';
import { seedCourse } from './seed-course';
import { seedExam } from './seed-exam';
import { seedGamification } from './seed-gamification';
import { seedGrammar } from './seed-grammar';
import { seedQuestion } from './seed-question';
import { seedVocabulary } from './seed-vocabulary';

const ROLES = [
  { code: enumData.USER_ROLE.SUPER_ADMIN.code, name: enumData.USER_ROLE.SUPER_ADMIN.name },
  { code: enumData.USER_ROLE.ADMIN.code, name: enumData.USER_ROLE.ADMIN.name },
  { code: enumData.USER_ROLE.STAFF.code, name: enumData.USER_ROLE.STAFF.name },
  { code: enumData.USER_ROLE.MANAGER.code, name: enumData.USER_ROLE.MANAGER.name },
  { code: enumData.USER_ROLE.TEACHER.code, name: enumData.USER_ROLE.TEACHER.name },
  { code: enumData.USER_ROLE.STUDENT.code, name: enumData.USER_ROLE.STUDENT.name },
];

const ACCOUNTS = [
  {
    email: 'admin@lingoarena.com',
    username: 'admin',
    password: 'Admin@123456',
    fullName: 'LingoArena Super Admin',
    roleCode: enumData.USER_ROLE.SUPER_ADMIN.code,
  },
  {
    email: 'teacher@lingoarena.com',
    username: 'teacher',
    password: 'Teacher@123456',
    fullName: 'Giảng viên LingoArena',
    roleCode: enumData.USER_ROLE.TEACHER.code,
  },
  {
    email: 'student@lingoarena.com',
    username: 'student',
    password: 'Student@123456',
    fullName: 'Học viên Demo',
    roleCode: enumData.USER_ROLE.STUDENT.code,
  },
];

async function ensureRole(code: string, name: string) {
  const existing = await dataSource.query(
    `SELECT id FROM roles WHERE code = $1 AND "isDeleted" = false LIMIT 1`,
    [code],
  );
  if (existing[0]?.id) return existing[0].id as string;

  const inserted = await dataSource.query(
    `INSERT INTO roles (code, name, description, "isSystem", "isDeleted", version, "createdAt")
     VALUES ($1, $2, $3, true, false, 0, NOW())
     RETURNING id`,
    [code, name, `Vai trò hệ thống ${name}`],
  );
  return inserted[0].id as string;
}

async function ensureAccount(account: (typeof ACCOUNTS)[number], roleId: string) {
  const existing = await dataSource.query(
    `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND "isDeleted" = false LIMIT 1`,
    [account.email],
  );

  let userId = existing[0]?.id as string | undefined;
  const passwordHash = await hash(account.password, PWD_SALT_ROUNDS);

  if (!userId) {
    const inserted = await dataSource.query(
      `INSERT INTO users
        (email, username, "passwordHash", status, "emailVerifiedAt", "preferredLanguage", timezone, "isDeleted", version, "createdAt")
       VALUES ($1, $2, $3, $4, NOW(), 'vi', 'Asia/Ho_Chi_Minh', false, 0, NOW())
       RETURNING id`,
      [account.email, account.username, passwordHash, enumData.USER_STATUS.ACTIVE.code],
    );
    userId = inserted[0].id;
  } else {
    await dataSource.query(
      `UPDATE users
       SET username = COALESCE(username, $2),
           "passwordHash" = $3,
           status = $4,
           "emailVerifiedAt" = COALESCE("emailVerifiedAt", NOW())
       WHERE id = $1`,
      [userId, account.username, passwordHash, enumData.USER_STATUS.ACTIVE.code],
    );
  }

  const profile = await dataSource.query(
    `SELECT id FROM user_profiles WHERE "userId" = $1 LIMIT 1`,
    [userId],
  );
  if (!profile[0]) {
    await dataSource.query(
      `INSERT INTO user_profiles ("userId", "fullName", "displayName", "countryCode", "isDeleted", version, "createdAt")
       VALUES ($1, $2, $2, 'VN', false, 0, NOW())`,
      [userId, account.fullName],
    );
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

  return userId;
}

async function run() {
  await dataSource.initialize();
  try {
    const roleIds = new Map<string, string>();
    for (const role of ROLES) {
      roleIds.set(role.code, await ensureRole(role.code, role.name));
    }

    for (const account of ACCOUNTS) {
      const roleId = roleIds.get(account.roleCode);
      if (!roleId) continue;
      await ensureAccount(account, roleId);
      console.log(`Seeded ${account.email} / ${account.password} (${account.roleCode})`);
    }

    console.log('Auth seed completed.');
    await seedExam(dataSource);
    console.log('Exam seed completed.');
    await seedVocabulary(dataSource);
    console.log('Vocabulary seed completed.');
    await seedQuestion(dataSource);
    console.log('Question seed completed.');
    await seedGrammar(dataSource);
    console.log('Grammar seed completed.');
    await seedAssessment(dataSource);
    console.log('Assessment seed completed.');
    await seedCourse(dataSource);
    console.log('Course seed completed.');
    await seedArena();
    console.log('Arena seed completed.');
    await seedGamification();
    console.log('Gamification seed completed.');
    await seedCommerce();
    console.log('Commerce seed completed.');
  } finally {
    await dataSource.destroy();
  }
}

run().catch(error => {
  console.error('Auth seed failed:', error);
  process.exit(1);
});
