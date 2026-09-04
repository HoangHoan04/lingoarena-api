import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropVocabularyDeckExamType1788489200000 implements MigrationInterface {
  name = 'DropVocabularyDeckExamType1788489200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vocabulary_decks" DROP CONSTRAINT IF EXISTS "FK_7870c5906769a6179593c03ed7e"`,
    );
    await queryRunner.query(`ALTER TABLE "vocabulary_decks" DROP COLUMN IF EXISTS "examTypeId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vocabulary_decks" ADD "examTypeId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "vocabulary_decks" ADD CONSTRAINT "FK_7870c5906769a6179593c03ed7e" FOREIGN KEY ("examTypeId") REFERENCES "exam_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
