import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeDatabase1788487734899 implements MigrationInterface {
    name = 'ChangeDatabase1788487734899'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_lessons_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_grammar_structures_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_support_tickets_assignee_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_support_tickets_user_status"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "grammar_structures" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "permissionCodes" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "permissionCodes" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD "status" character varying(20) NOT NULL DEFAULT 'OPEN'`);
        await queryRunner.query(`ALTER TABLE "grammar_structures" ADD "status" character varying(20) NOT NULL DEFAULT 'DRAFT'`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "status" character varying(20) NOT NULL DEFAULT 'NEW'`);
        await queryRunner.query(`CREATE INDEX "idx_support_tickets_user_status" ON "support_tickets" USING btree ("status", "userId") `);
        await queryRunner.query(`CREATE INDEX "idx_support_tickets_assignee_status" ON "support_tickets" USING btree ("assignedToUserId", "status") `);
        await queryRunner.query(`CREATE INDEX "idx_grammar_structures_status" ON "grammar_structures" USING btree ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_lessons_status" ON "lessons" USING btree ("status") `);
    }

}
