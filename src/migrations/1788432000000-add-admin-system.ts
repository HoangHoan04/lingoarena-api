import { hash } from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { PWD_SALT_ROUNDS } from '../common/constants';

const ADMIN_EMAIL = 'admin@lingoarena.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123@';
const ADMIN_FULL_NAME = 'Quản trị hệ thống';
const SUPER_ADMIN_CODE = 'SUPER_ADMIN';

export class AddAdminSystem1788432000000 implements MigrationInterface {
  name = 'AddAdminSystem1788432000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const passwordHash = await hash(ADMIN_PASSWORD, PWD_SALT_ROUNDS);

    const roleRows = await queryRunner.query(`SELECT id FROM roles WHERE code = $1 LIMIT 1`, [
      SUPER_ADMIN_CODE,
    ]);
    let roleId: string;
    if (roleRows.length > 0) {
      roleId = roleRows[0].id;
      await queryRunner.query(
        `UPDATE roles
         SET name = $1, "nameEn" = $2, description = $3, "isSystem" = true, "isDeleted" = false, "updatedAt" = NOW()
         WHERE id = $4`,
        ['Quản trị viên tối cao', 'Super Admin', 'Toàn quyền quản trị hệ thống', roleId],
      );
    } else {
      const inserted = await queryRunner.query(
        `INSERT INTO roles (code, name, "nameEn", description, "isSystem", "permissionCodes", "createdAt", "updatedAt", "isDeleted")
         VALUES ($1, $2, $3, $4, true, '[]'::jsonb, NOW(), NOW(), false)
         RETURNING id`,
        [SUPER_ADMIN_CODE, 'Quản trị viên tối cao', 'Super Admin', 'Toàn quyền quản trị hệ thống'],
      );
      roleId = inserted[0].id;
    }

    const userRows = await queryRunner.query(
      `SELECT id FROM users
       WHERE (LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2))
         AND "isDeleted" = false
       ORDER BY CASE WHEN LOWER(email) = LOWER($1) THEN 0 ELSE 1 END
       LIMIT 1`,
      [ADMIN_EMAIL, ADMIN_USERNAME],
    );

    let userId: string;
    if (userRows.length > 0) {
      userId = userRows[0].id;
      await queryRunner.query(
        `UPDATE users
         SET email = $1,
             username = $2,
             "passwordHash" = $3,
             "isAdmin" = true,
             "emailVerifiedAt" = COALESCE("emailVerifiedAt", NOW()),
             "preferredLanguage" = COALESCE("preferredLanguage", 'vi'),
             timezone = COALESCE(timezone, 'Asia/Ho_Chi_Minh'),
             "isDeleted" = false,
             "updatedAt" = NOW()
         WHERE id = $4`,
        [ADMIN_EMAIL, ADMIN_USERNAME, passwordHash, userId],
      );
    } else {
      const inserted = await queryRunner.query(
        `INSERT INTO users (
           email, username, "passwordHash", "isAdmin", "emailVerifiedAt",
           "preferredLanguage", timezone, "createdAt", "updatedAt", "isDeleted"
         )
         VALUES ($1, $2, $3, true, NOW(), 'vi', 'Asia/Ho_Chi_Minh', NOW(), NOW(), false)
         RETURNING id`,
        [ADMIN_EMAIL, ADMIN_USERNAME, passwordHash],
      );
      userId = inserted[0].id;
    }

    const profileRows = await queryRunner.query(
      `SELECT id FROM user_profiles WHERE "userId" = $1 LIMIT 1`,
      [userId],
    );
    if (profileRows.length > 0) {
      await queryRunner.query(
        `UPDATE user_profiles
         SET "fullName" = $1, "displayName" = $2, "isDeleted" = false, "updatedAt" = NOW()
         WHERE id = $3`,
        [ADMIN_FULL_NAME, ADMIN_USERNAME, profileRows[0].id],
      );
    } else {
      await queryRunner.query(
        `INSERT INTO user_profiles ("userId", "fullName", "displayName", "countryCode", "createdAt", "updatedAt", "isDeleted")
         VALUES ($1, $2, $3, 'VN', NOW(), NOW(), false)`,
        [userId, ADMIN_FULL_NAME, ADMIN_USERNAME],
      );
    }

    const linkRows = await queryRunner.query(
      `SELECT id FROM user_roles
       WHERE "userId" = $1 AND "roleId" = $2 AND "scopeType" = 'GLOBAL' AND "isDeleted" = false
       LIMIT 1`,
      [userId, roleId],
    );
    if (linkRows.length === 0) {
      await queryRunner.query(
        `INSERT INTO user_roles ("userId", "roleId", "scopeType", "createdAt", "updatedAt", "isDeleted")
         VALUES ($1, $2, 'GLOBAL', NOW(), NOW(), false)`,
        [userId, roleId],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const users = await queryRunner.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [ADMIN_EMAIL],
    );
    if (!users.length) return;

    const userId = users[0].id;
    await queryRunner.query(`DELETE FROM user_roles WHERE "userId" = $1`, [userId]);
    await queryRunner.query(`DELETE FROM user_profiles WHERE "userId" = $1`, [userId]);
    await queryRunner.query(`DELETE FROM user_sessions WHERE "userId" = $1`, [userId]);
    await queryRunner.query(`DELETE FROM users WHERE id = $1`, [userId]);
  }
}
