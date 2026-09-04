import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropContactSubmissions1788433000000 implements MigrationInterface {
  name = 'DropContactSubmissions1788433000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_contact_submissions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_contact_submissions_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_5f0bd63150fa494f96fe00a8f5"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_submissions"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contact_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying, "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updatedBy" character varying, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" character varying, "isDeleted" boolean NOT NULL DEFAULT false, "version" integer NOT NULL DEFAULT '0', "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20), "subject" character varying(255), "message" text NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'NEW', "handledByUserId" uuid, "handledAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_5b7b44e69fd5866a5769aeeb9d8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5f0bd63150fa494f96fe00a8f5" ON "contact_submissions" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_contact_submissions_email" ON "contact_submissions" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_contact_submissions_status" ON "contact_submissions" ("status")`,
    );
  }
}
