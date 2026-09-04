import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeData1788486390655 implements MigrationInterface {
    name = 'ChangeData1788486390655'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_options" DROP CONSTRAINT "FK_9603921362dc02d60f7e779b6ea"`);
        await queryRunner.query(`ALTER TABLE "assessment_items" DROP CONSTRAINT "FK_fe54165ae460c417ed07f63b5e4"`);
        await queryRunner.query(`DROP INDEX "public"."idx_question_groups_status"`);
        await queryRunner.query(`DROP INDEX "public"."uq_question_options_version_key"`);
        await queryRunner.query(`DROP INDEX "public"."idx_questions_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_assessments_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_vocabularies_status"`);

        // 1. Add question content columns to "questions"
        await queryRunner.query(`ALTER TABLE "questions" ADD "prompt" text NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "instructions" text`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "contentJson" jsonb`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "correctAnswerJson" jsonb`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "explanation" text`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "explanationEn" text`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "sampleAnswer" text`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "sampleBand" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "sampleAnalysisVi" text`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "outlineIdeasJson" jsonb`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "suggestedVocabJson" jsonb`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "imageUrl" text`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "metaJson" jsonb`);

        // 2. Migrate existing question content from question_versions into questions
        await queryRunner.query(`
            UPDATE "questions" q
            SET
                "prompt" = COALESCE(qv."prompt", ''),
                "instructions" = qv."instructions",
                "contentJson" = qv."contentJson",
                "correctAnswerJson" = qv."correctAnswerJson",
                "explanation" = qv."explanation",
                "explanationEn" = qv."explanationEn",
                "sampleAnswer" = qv."sampleAnswer",
                "sampleBand" = qv."sampleBand",
                "sampleAnalysisVi" = qv."sampleAnalysisVi",
                "outlineIdeasJson" = qv."outlineIdeasJson",
                "suggestedVocabJson" = qv."suggestedVocabJson",
                "imageUrl" = qv."imageUrl",
                "metaJson" = qv."metaJson"
            FROM "question_versions" qv
            WHERE (q."currentVersionId" IS NOT NULL AND q."currentVersionId" = qv."id")
               OR (q."currentVersionId" IS NULL AND q."id" = qv."questionId")
        `);

        // 3. Update question_options.questionVersionId to point to questions.id instead of question_versions.id
        await queryRunner.query(`
            UPDATE "question_options" qo
            SET "questionVersionId" = qv."questionId"
            FROM "question_versions" qv
            WHERE qo."questionVersionId" = qv."id"
        `);
        // Remove any orphaned question_options that don't belong to any valid question
        await queryRunner.query(`
            DELETE FROM "question_options"
            WHERE "questionVersionId" NOT IN (SELECT "id" FROM "questions")
        `);

        // 4. Rename questionVersionId to questionId
        await queryRunner.query(`ALTER TABLE "question_options" RENAME COLUMN "questionVersionId" TO "questionId"`);

        // 5. Drop deprecated columns
        await queryRunner.query(`ALTER TABLE "arena_match_questions" DROP COLUMN "questionVersionId"`);
        await queryRunner.query(`ALTER TABLE "question_groups" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "currentVersionId"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "assessment_items" DROP COLUMN "questionVersionId"`);
        await queryRunner.query(`ALTER TABLE "assessments" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "attempt_questions" DROP COLUMN "questionVersionId"`);
        await queryRunner.query(`ALTER TABLE "vocabularies" DROP COLUMN "status"`);

        // 6. Update column defaults
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "permissionCodes" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "classrooms" ALTER COLUMN "status" SET DEFAULT 'NEW'`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "status" SET DEFAULT 'NEW'`);
        await queryRunner.query(`ALTER TABLE "courses" ALTER COLUMN "status" SET DEFAULT 'NEW'`);

        // 7. Add index and foreign key constraint
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_question_options_question_key" ON "question_options" ("questionId", "optionKey") WHERE "isDeleted" = false`);
        await queryRunner.query(`ALTER TABLE "question_options" ADD CONSTRAINT "FK_c654af7759a681f1b1addbe35bf" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_options" DROP CONSTRAINT "FK_c654af7759a681f1b1addbe35bf"`);
        await queryRunner.query(`DROP INDEX "public"."uq_question_options_question_key"`);
        await queryRunner.query(`ALTER TABLE "courses" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
        await queryRunner.query(`ALTER TABLE "classrooms" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "permissionCodes" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "metaJson"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "imageUrl"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "suggestedVocabJson"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "outlineIdeasJson"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "sampleAnalysisVi"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "sampleBand"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "sampleAnswer"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "explanationEn"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "explanation"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "correctAnswerJson"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "contentJson"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "instructions"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "prompt"`);
        await queryRunner.query(`ALTER TABLE "vocabularies" ADD "status" character varying(20) NOT NULL DEFAULT 'DRAFT'`);
        await queryRunner.query(`ALTER TABLE "attempt_questions" ADD "questionVersionId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assessments" ADD "status" character varying(20) NOT NULL DEFAULT 'DRAFT'`);
        await queryRunner.query(`ALTER TABLE "assessment_items" ADD "questionVersionId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "status" character varying(20) NOT NULL DEFAULT 'DRAFT'`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "currentVersionId" uuid`);
        await queryRunner.query(`ALTER TABLE "question_groups" ADD "status" character varying(20) NOT NULL DEFAULT 'DRAFT'`);
        await queryRunner.query(`ALTER TABLE "arena_match_questions" ADD "questionVersionId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "question_options" RENAME COLUMN "questionId" TO "questionVersionId"`);
        await queryRunner.query(`CREATE INDEX "idx_vocabularies_status" ON "vocabularies" USING btree ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_assessments_status" ON "assessments" USING btree ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_questions_status" ON "questions" USING btree ("status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_question_options_version_key" ON "question_options" USING btree ("optionKey", "questionVersionId") WHERE ("isDeleted" = false)`);
        await queryRunner.query(`CREATE INDEX "idx_question_groups_status" ON "question_groups" USING btree ("status") `);
        await queryRunner.query(`ALTER TABLE "assessment_items" ADD CONSTRAINT "FK_fe54165ae460c417ed07f63b5e4" FOREIGN KEY ("questionVersionId") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_options" ADD CONSTRAINT "FK_9603921362dc02d60f7e779b6ea" FOREIGN KEY ("questionVersionId") REFERENCES "question_versions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
