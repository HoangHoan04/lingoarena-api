import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVocabularyImageUrl1788489100000 implements MigrationInterface {
  name = 'AddVocabularyImageUrl1788489100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vocabularies" ADD "imageUrl" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vocabularies" DROP COLUMN "imageUrl"`);
  }
}
