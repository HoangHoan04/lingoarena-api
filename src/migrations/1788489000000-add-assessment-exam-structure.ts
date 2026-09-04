import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssessmentExamStructure1788489000000 implements MigrationInterface {
  name = 'AddAssessmentExamStructure1788489000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assessments" ADD "examStructureId" uuid`);
    await queryRunner.query(
      `CREATE INDEX "idx_assessments_exam_structure" ON "assessments" ("examStructureId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD CONSTRAINT "FK_assessments_exam_structure" FOREIGN KEY ("examStructureId") REFERENCES "exam_structures"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`
      UPDATE "assessments" AS a
      SET "examStructureId" = s."examStructureId"
      FROM (
        SELECT DISTINCT ON ("assessmentId") "assessmentId", "examStructureId"
        FROM "assessment_sections"
        WHERE "isDeleted" = false
        ORDER BY "assessmentId", "sortOrder" ASC, "createdAt" ASC
      ) AS s
      WHERE a.id = s."assessmentId"
        AND a."examStructureId" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP CONSTRAINT "FK_assessments_exam_structure"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_assessments_exam_structure"`);
    await queryRunner.query(`ALTER TABLE "assessments" DROP COLUMN "examStructureId"`);
  }
}
