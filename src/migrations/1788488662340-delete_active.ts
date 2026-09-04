import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteActive1788488662340 implements MigrationInterface {
    name = 'DeleteActive1788488662340'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_exam_types_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ai_tutor_personas_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_daily_challenges_active_date"`);
        await queryRunner.query(`ALTER TABLE "exam_types" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "exam_structures" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "ai_tutor_personas" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "achievements" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "daily_challenges" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "taxonomies" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "permissionCodes" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "permissionCodes" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "taxonomies" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "daily_challenges" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "achievements" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "ai_tutor_personas" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "exam_structures" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "exam_types" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`CREATE INDEX "idx_daily_challenges_active_date" ON "daily_challenges" USING btree ("activeDate", "isActive") `);
        await queryRunner.query(`CREATE INDEX "idx_ai_tutor_personas_is_active" ON "ai_tutor_personas" USING btree ("isActive") `);
        await queryRunner.query(`CREATE INDEX "idx_exam_types_is_active" ON "exam_types" USING btree ("isActive") `);
    }

}
