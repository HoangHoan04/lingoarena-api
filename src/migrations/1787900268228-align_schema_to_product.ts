import { MigrationInterface, QueryRunner } from 'typeorm';

const BASE = `"id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying, "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updatedBy" character varying, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" character varying, "isDeleted" boolean NOT NULL DEFAULT false, "version" integer NOT NULL DEFAULT '0'`;

export class AlignSchemaToProduct1787900268228 implements MigrationInterface {
  name = 'AlignSchemaToProduct1787900268228';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "classrooms" DROP CONSTRAINT IF EXISTS "FK_ea22bf3c6b069755e01340f6334"`,
    );
    await queryRunner.query(
      `UPDATE "classrooms" SET "teacherUserId" = "teacherId" WHERE "teacherId" IS NOT NULL AND ("teacherUserId" IS NULL OR "teacherUserId" IS DISTINCT FROM "teacherId")`,
    );
    await queryRunner.query(`ALTER TABLE "classrooms" DROP COLUMN IF EXISTS "teacherId"`);
    await queryRunner.query(
      `ALTER TABLE "classrooms" ADD CONSTRAINT "FK_classrooms_teacher_user" FOREIGN KEY ("teacherUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL`);
    await queryRunner.query(`UPDATE "users" SET "passwordHash" = NULL WHERE "passwordHash" = ''`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" character varying(50)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_users_username_alive" ON "users" ("username") WHERE "username" IS NOT NULL AND "isDeleted" = false`,
    );

    await queryRunner.query(`ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "seatUsed" integer NOT NULL DEFAULT 0`);

    await queryRunner.query(
      `DELETE FROM "vocabularies" a USING "vocabularies" b WHERE a."isDeleted" = false AND b."isDeleted" = false AND a."normalizedWord" = b."normalizedWord" AND a."partOfSpeech" = b."partOfSpeech" AND a."id" > b."id"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_vocabularies_word_pos_alive" ON "vocabularies" ("normalizedWord", "partOfSpeech") WHERE "isDeleted" = false`,
    );

    await queryRunner.query(`ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "irtA" numeric(8,4)`);
    await queryRunner.query(`ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "irtB" numeric(8,4)`);
    await queryRunner.query(`ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "irtC" numeric(8,4)`);
    await queryRunner.query(
      `ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "exposureCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "lastCalibratedAt" TIMESTAMP WITH TIME ZONE`);

    await queryRunner.query(
      `ALTER TABLE "assessment_attempts" ADD COLUMN IF NOT EXISTS "lastHeartbeatAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_attempts" ADD COLUMN IF NOT EXISTS "focusLossCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_attempts" ADD COLUMN IF NOT EXISTS "clientClockSkewMs" integer`,
    );

    await queryRunner.query(`ALTER TABLE "grading_results" ALTER COLUMN "criterionScoresJson" DROP NOT NULL`);

    await queryRunner.query(`ALTER TABLE "grammar_topics" ADD COLUMN IF NOT EXISTS "canonicalTopicId" uuid`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_grammar_topics_canonical_topic" ON "grammar_topics" ("canonicalTopicId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "grammar_topics" ADD CONSTRAINT "FK_grammar_topics_canonical_topic" FOREIGN KEY ("canonicalTopicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`ALTER TABLE "arena_matches" ADD COLUMN IF NOT EXISTS "seasonId" uuid`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_arena_matches_season_id" ON "arena_matches" ("seasonId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "lesson_progress" ADD CONSTRAINT "FK_lesson_progress_last_block" FOREIGN KEY ("lastBlockId") REFERENCES "lesson_blocks"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD CONSTRAINT "FK_assignments_created_by_user" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vocabulary_decks" ADD CONSTRAINT "FK_vocabulary_decks_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "lesson_block_items" (${BASE}, "lessonBlockId" uuid NOT NULL, "questionId" uuid NOT NULL, "questionVersionId" uuid NOT NULL, "points" numeric(5,2) NOT NULL DEFAULT 1, "sortOrder" integer NOT NULL DEFAULT 0, "isRequired" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_lesson_block_items" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_lesson_block_items_created" ON "lesson_block_items" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX "idx_lesson_block_items_block_id" ON "lesson_block_items" ("lessonBlockId")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_lesson_block_items_block_question" ON "lesson_block_items" ("lessonBlockId", "questionId")`,
    );

    await queryRunner.query(
      `CREATE TABLE "grading_result_criterion_scores" (${BASE}, "gradingResultId" uuid NOT NULL, "rubricCriterionId" uuid NOT NULL, "score" numeric(5,2) NOT NULL, "comment" text, CONSTRAINT "PK_grading_result_criterion_scores" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_grading_result_scores_created" ON "grading_result_criterion_scores" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_grading_result_scores_result_id" ON "grading_result_criterion_scores" ("gradingResultId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_grading_result_criterion" ON "grading_result_criterion_scores" ("gradingResultId", "rubricCriterionId")`,
    );

    await queryRunner.query(
      `CREATE TABLE "certificate_templates" (${BASE}, "code" character varying(50) NOT NULL, "title" character varying(255) NOT NULL, "sourceType" character varying(30) NOT NULL, "examTypeId" uuid, "courseId" uuid, "minScore" numeric(5,2), "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_certificate_templates_code" UNIQUE ("code"), CONSTRAINT "PK_certificate_templates" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_certificate_templates_created" ON "certificate_templates" ("createdAt")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_certificate_templates_code" ON "certificate_templates" ("code")`,
    );

    await queryRunner.query(
      `CREATE TABLE "user_certificates" (${BASE}, "userId" uuid NOT NULL, "templateId" uuid, "sourceType" character varying(30) NOT NULL, "sourceId" uuid NOT NULL, "title" character varying(255) NOT NULL, "score" numeric(5,2), "convertedScore" numeric(5,2), "verifyCode" character varying(40) NOT NULL, "pdfAssetId" uuid, "status" character varying(20) NOT NULL DEFAULT 'ISSUED', "issuedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_user_certificates_verify" UNIQUE ("verifyCode"), CONSTRAINT "PK_user_certificates" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_user_certificates_created" ON "user_certificates" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX "idx_user_certificates_user_id" ON "user_certificates" ("userId")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_user_certificates_verify_code" ON "user_certificates" ("verifyCode")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_user_certificates_source" ON "user_certificates" ("userId", "sourceType", "sourceId")`,
    );

    await queryRunner.query(
      `CREATE TABLE "arena_seasons" (${BASE}, "code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "examSkillId" uuid, "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'UPCOMING', "resetElo" boolean NOT NULL DEFAULT false, "rewardJson" jsonb, CONSTRAINT "UQ_arena_seasons_code" UNIQUE ("code"), CONSTRAINT "PK_arena_seasons" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_arena_seasons_created" ON "arena_seasons" ("createdAt")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_arena_seasons_code" ON "arena_seasons" ("code")`);
    await queryRunner.query(`CREATE INDEX "idx_arena_seasons_status" ON "arena_seasons" ("status")`);

    await queryRunner.query(
      `CREATE TABLE "arena_season_standings" (${BASE}, "seasonId" uuid NOT NULL, "userId" uuid NOT NULL, "examSkillId" uuid NOT NULL, "eloRating" integer NOT NULL DEFAULT 1000, "matchesPlayed" integer NOT NULL DEFAULT 0, "wins" integer NOT NULL DEFAULT 0, "losses" integer NOT NULL DEFAULT 0, "draws" integer NOT NULL DEFAULT 0, "points" integer NOT NULL DEFAULT 0, "rank" integer, CONSTRAINT "PK_arena_season_standings" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_arena_season_standings_created" ON "arena_season_standings" ("createdAt")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_arena_season_standings" ON "arena_season_standings" ("seasonId", "userId", "examSkillId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_arena_season_standings_rank" ON "arena_season_standings" ("seasonId", "examSkillId", "eloRating")`,
    );

    await queryRunner.query(
      `CREATE TABLE "arena_queue_tickets" (${BASE}, "userId" uuid NOT NULL, "examSkillId" uuid NOT NULL, "matchMode" character varying(20) NOT NULL DEFAULT 'RANKED', "eloAtEnqueue" integer NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'WAITING', "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "matchedMatchId" uuid, CONSTRAINT "PK_arena_queue_tickets" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_arena_queue_tickets_created" ON "arena_queue_tickets" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX "idx_arena_queue_user_id" ON "arena_queue_tickets" ("userId")`);
    await queryRunner.query(
      `CREATE INDEX "idx_arena_queue_status_skill" ON "arena_queue_tickets" ("status", "examSkillId", "matchMode")`,
    );

    await queryRunner.query(
      `CREATE TABLE "arena_challenges" (${BASE}, "challengerUserId" uuid NOT NULL, "opponentUserId" uuid NOT NULL, "examSkillId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'PENDING', "matchId" uuid, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "message" character varying(255), CONSTRAINT "PK_arena_challenges" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_arena_challenges_created" ON "arena_challenges" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX "idx_arena_challenges_challenger_id" ON "arena_challenges" ("challengerUserId")`);
    await queryRunner.query(
      `CREATE INDEX "idx_arena_challenges_opponent_status" ON "arena_challenges" ("opponentUserId", "status")`,
    );

    await queryRunner.query(
      `CREATE TABLE "point_ledger_entries" (${BASE}, "userId" uuid NOT NULL, "amount" integer NOT NULL, "balanceAfter" integer NOT NULL, "reason" character varying(50) NOT NULL, "refType" character varying(50), "refId" uuid, "description" character varying(255), CONSTRAINT "PK_point_ledger_entries" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_point_ledger_created" ON "point_ledger_entries" ("createdAt")`);
    await queryRunner.query(
      `CREATE INDEX "idx_point_ledger_user_created" ON "point_ledger_entries" ("userId", "createdAt")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_point_ledger_ref" ON "point_ledger_entries" ("refType", "refId")`);

    await queryRunner.query(
      `CREATE TABLE "daily_challenges" (${BASE}, "code" character varying(50) NOT NULL, "title" character varying(255) NOT NULL, "description" text, "challengeType" character varying(50) NOT NULL, "targetCount" integer NOT NULL DEFAULT 1, "rewardPoints" integer NOT NULL DEFAULT 0, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_daily_challenges_code" UNIQUE ("code"), CONSTRAINT "PK_daily_challenges" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_daily_challenges_created" ON "daily_challenges" ("createdAt")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_daily_challenges_code" ON "daily_challenges" ("code")`);
    await queryRunner.query(`CREATE INDEX "idx_daily_challenges_is_active" ON "daily_challenges" ("isActive")`);

    await queryRunner.query(
      `CREATE TABLE "user_daily_challenge_progress" (${BASE}, "userId" uuid NOT NULL, "dailyChallengeId" uuid NOT NULL, "activityDate" date NOT NULL, "progressCount" integer NOT NULL DEFAULT 0, "targetCount" integer NOT NULL DEFAULT 1, "completedAt" TIMESTAMP WITH TIME ZONE, "pointsAwarded" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_user_daily_challenge_progress" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_daily_challenge_progress_created" ON "user_daily_challenge_progress" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_user_daily_challenge_date" ON "user_daily_challenge_progress" ("userId", "dailyChallengeId", "activityDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_daily_challenge_user_date" ON "user_daily_challenge_progress" ("userId", "activityDate")`,
    );

    await queryRunner.query(
      `CREATE TABLE "coupon_redemptions" (${BASE}, "couponId" uuid NOT NULL, "userId" uuid NOT NULL, "orderId" uuid NOT NULL, "discountAmount" bigint NOT NULL, "redeemedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_coupon_redemptions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_coupon_redemptions_created" ON "coupon_redemptions" ("createdAt")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_coupon_redemptions_order" ON "coupon_redemptions" ("couponId", "orderId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_coupon_redemptions_user_coupon" ON "coupon_redemptions" ("userId", "couponId")`,
    );

    await queryRunner.query(
      `CREATE TABLE "invoices" (${BASE}, "invoiceNumber" character varying(50) NOT NULL, "orderId" uuid NOT NULL, "userId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'DRAFT', "buyerName" character varying(255) NOT NULL, "buyerTaxCode" character varying(50), "buyerAddress" text, "currency" character varying(10) NOT NULL DEFAULT 'VND', "subtotalAmount" bigint NOT NULL, "taxAmount" bigint NOT NULL DEFAULT 0, "totalAmount" bigint NOT NULL, "pdfAssetId" uuid, "issuedAt" TIMESTAMP WITH TIME ZONE, "paidAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_invoices_number" UNIQUE ("invoiceNumber"), CONSTRAINT "PK_invoices" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_invoices_created" ON "invoices" ("createdAt")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_invoices_number" ON "invoices" ("invoiceNumber")`);
    await queryRunner.query(`CREATE INDEX "idx_invoices_order_id" ON "invoices" ("orderId")`);
    await queryRunner.query(`CREATE INDEX "idx_invoices_user_id" ON "invoices" ("userId")`);

    await queryRunner.query(
      `CREATE TABLE "organization_subscriptions" (${BASE}, "organizationId" uuid NOT NULL, "subscriptionId" uuid NOT NULL, "seatLimit" integer NOT NULL DEFAULT 0, "seatUsed" integer NOT NULL DEFAULT 0, "status" character varying(50) NOT NULL DEFAULT 'ACTIVE', "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_organization_subscriptions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_organization_subscriptions_created" ON "organization_subscriptions" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_org_subscriptions" ON "organization_subscriptions" ("organizationId", "subscriptionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_org_subscriptions_org_id" ON "organization_subscriptions" ("organizationId")`,
    );

    await queryRunner.query(
      `CREATE TABLE "contact_submissions" (${BASE}, "userId" uuid, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20), "subject" character varying(255) NOT NULL, "message" text NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'NEW', CONSTRAINT "PK_contact_submissions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_contact_submissions_created" ON "contact_submissions" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX "idx_contact_submissions_status" ON "contact_submissions" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_contact_submissions_email" ON "contact_submissions" ("email")`);

    await queryRunner.query(
      `CREATE TABLE "vocabulary_review_sessions" (${BASE}, "userId" uuid NOT NULL, "deckId" uuid, "status" character varying(20) NOT NULL DEFAULT 'IN_PROGRESS', "cardsDue" integer NOT NULL DEFAULT 0, "cardsReviewed" integer NOT NULL DEFAULT 0, "cardsCorrect" integer NOT NULL DEFAULT 0, "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "endedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_vocabulary_review_sessions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vocabulary_review_sessions_created" ON "vocabulary_review_sessions" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_vocab_review_sessions_user_started" ON "vocabulary_review_sessions" ("userId", "startedAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_vocab_review_sessions_status" ON "vocabulary_review_sessions" ("status")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_learning_path_items_type_id" ON "learning_path_items" ("itemType", "itemId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_mastery_records_type_id" ON "mastery_records" ("entityType", "entityId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "lesson_block_items" ADD CONSTRAINT "FK_lesson_block_items_block" FOREIGN KEY ("lessonBlockId") REFERENCES "lesson_blocks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_block_items" ADD CONSTRAINT "FK_lesson_block_items_question" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_block_items" ADD CONSTRAINT "FK_lesson_block_items_version" FOREIGN KEY ("questionVersionId") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grading_result_criterion_scores" ADD CONSTRAINT "FK_grading_result_scores_result" FOREIGN KEY ("gradingResultId") REFERENCES "grading_results"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grading_result_criterion_scores" ADD CONSTRAINT "FK_grading_result_scores_criterion" FOREIGN KEY ("rubricCriterionId") REFERENCES "rubric_criteria"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificate_templates" ADD CONSTRAINT "FK_certificate_templates_exam_type" FOREIGN KEY ("examTypeId") REFERENCES "exam_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificate_templates" ADD CONSTRAINT "FK_certificate_templates_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certificates" ADD CONSTRAINT "FK_user_certificates_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certificates" ADD CONSTRAINT "FK_user_certificates_template" FOREIGN KEY ("templateId") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certificates" ADD CONSTRAINT "FK_user_certificates_pdf" FOREIGN KEY ("pdfAssetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_seasons" ADD CONSTRAINT "FK_arena_seasons_skill" FOREIGN KEY ("examSkillId") REFERENCES "exam_skills"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_matches" ADD CONSTRAINT "FK_arena_matches_season" FOREIGN KEY ("seasonId") REFERENCES "arena_seasons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_season_standings" ADD CONSTRAINT "FK_arena_season_standings_season" FOREIGN KEY ("seasonId") REFERENCES "arena_seasons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_season_standings" ADD CONSTRAINT "FK_arena_season_standings_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_season_standings" ADD CONSTRAINT "FK_arena_season_standings_skill" FOREIGN KEY ("examSkillId") REFERENCES "exam_skills"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_queue_tickets" ADD CONSTRAINT "FK_arena_queue_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_queue_tickets" ADD CONSTRAINT "FK_arena_queue_skill" FOREIGN KEY ("examSkillId") REFERENCES "exam_skills"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_queue_tickets" ADD CONSTRAINT "FK_arena_queue_match" FOREIGN KEY ("matchedMatchId") REFERENCES "arena_matches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_challenges" ADD CONSTRAINT "FK_arena_challenges_challenger" FOREIGN KEY ("challengerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_challenges" ADD CONSTRAINT "FK_arena_challenges_opponent" FOREIGN KEY ("opponentUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_challenges" ADD CONSTRAINT "FK_arena_challenges_skill" FOREIGN KEY ("examSkillId") REFERENCES "exam_skills"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_challenges" ADD CONSTRAINT "FK_arena_challenges_match" FOREIGN KEY ("matchId") REFERENCES "arena_matches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_ledger_entries" ADD CONSTRAINT "FK_point_ledger_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_daily_challenge_progress" ADD CONSTRAINT "FK_user_daily_challenge_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_daily_challenge_progress" ADD CONSTRAINT "FK_user_daily_challenge_challenge" FOREIGN KEY ("dailyChallengeId") REFERENCES "daily_challenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_coupon" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_pdf" FOREIGN KEY ("pdfAssetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "FK_org_subs_org" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "FK_org_subs_subscription" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_submissions" ADD CONSTRAINT "FK_contact_submissions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vocabulary_review_sessions" ADD CONSTRAINT "FK_vocab_review_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vocabulary_review_sessions" ADD CONSTRAINT "FK_vocab_review_sessions_deck" FOREIGN KEY ("deckId") REFERENCES "vocabulary_decks"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "assessments" ADD CONSTRAINT "chk_assessments_status" CHECK ("status" IN ('DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD CONSTRAINT "chk_lessons_status" CHECK ("status" IN ('DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "arena_matches" ADD CONSTRAINT "chk_arena_matches_status" CHECK ("status" IN ('WAITING','IN_PROGRESS','FINISHED','CANCELLED'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "arena_matches" DROP CONSTRAINT IF EXISTS "chk_arena_matches_status"`);
    await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "chk_lessons_status"`);
    await queryRunner.query(`ALTER TABLE "assessments" DROP CONSTRAINT IF EXISTS "chk_assessments_status"`);

    await queryRunner.query(`ALTER TABLE "vocabulary_review_sessions" DROP CONSTRAINT IF EXISTS "FK_vocab_review_sessions_deck"`);
    await queryRunner.query(`ALTER TABLE "vocabulary_review_sessions" DROP CONSTRAINT IF EXISTS "FK_vocab_review_sessions_user"`);
    await queryRunner.query(`ALTER TABLE "contact_submissions" DROP CONSTRAINT IF EXISTS "FK_contact_submissions_user"`);
    await queryRunner.query(`ALTER TABLE "organization_subscriptions" DROP CONSTRAINT IF EXISTS "FK_org_subs_subscription"`);
    await queryRunner.query(`ALTER TABLE "organization_subscriptions" DROP CONSTRAINT IF EXISTS "FK_org_subs_org"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_pdf"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_user"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_order"`);
    await queryRunner.query(`ALTER TABLE "coupon_redemptions" DROP CONSTRAINT IF EXISTS "FK_coupon_redemptions_order"`);
    await queryRunner.query(`ALTER TABLE "coupon_redemptions" DROP CONSTRAINT IF EXISTS "FK_coupon_redemptions_user"`);
    await queryRunner.query(`ALTER TABLE "coupon_redemptions" DROP CONSTRAINT IF EXISTS "FK_coupon_redemptions_coupon"`);
    await queryRunner.query(`ALTER TABLE "user_daily_challenge_progress" DROP CONSTRAINT IF EXISTS "FK_user_daily_challenge_challenge"`);
    await queryRunner.query(`ALTER TABLE "user_daily_challenge_progress" DROP CONSTRAINT IF EXISTS "FK_user_daily_challenge_user"`);
    await queryRunner.query(`ALTER TABLE "point_ledger_entries" DROP CONSTRAINT IF EXISTS "FK_point_ledger_user"`);
    await queryRunner.query(`ALTER TABLE "arena_challenges" DROP CONSTRAINT IF EXISTS "FK_arena_challenges_match"`);
    await queryRunner.query(`ALTER TABLE "arena_challenges" DROP CONSTRAINT IF EXISTS "FK_arena_challenges_skill"`);
    await queryRunner.query(`ALTER TABLE "arena_challenges" DROP CONSTRAINT IF EXISTS "FK_arena_challenges_opponent"`);
    await queryRunner.query(`ALTER TABLE "arena_challenges" DROP CONSTRAINT IF EXISTS "FK_arena_challenges_challenger"`);
    await queryRunner.query(`ALTER TABLE "arena_queue_tickets" DROP CONSTRAINT IF EXISTS "FK_arena_queue_match"`);
    await queryRunner.query(`ALTER TABLE "arena_queue_tickets" DROP CONSTRAINT IF EXISTS "FK_arena_queue_skill"`);
    await queryRunner.query(`ALTER TABLE "arena_queue_tickets" DROP CONSTRAINT IF EXISTS "FK_arena_queue_user"`);
    await queryRunner.query(`ALTER TABLE "arena_season_standings" DROP CONSTRAINT IF EXISTS "FK_arena_season_standings_skill"`);
    await queryRunner.query(`ALTER TABLE "arena_season_standings" DROP CONSTRAINT IF EXISTS "FK_arena_season_standings_user"`);
    await queryRunner.query(`ALTER TABLE "arena_season_standings" DROP CONSTRAINT IF EXISTS "FK_arena_season_standings_season"`);
    await queryRunner.query(`ALTER TABLE "arena_matches" DROP CONSTRAINT IF EXISTS "FK_arena_matches_season"`);
    await queryRunner.query(`ALTER TABLE "arena_seasons" DROP CONSTRAINT IF EXISTS "FK_arena_seasons_skill"`);
    await queryRunner.query(`ALTER TABLE "user_certificates" DROP CONSTRAINT IF EXISTS "FK_user_certificates_pdf"`);
    await queryRunner.query(`ALTER TABLE "user_certificates" DROP CONSTRAINT IF EXISTS "FK_user_certificates_template"`);
    await queryRunner.query(`ALTER TABLE "user_certificates" DROP CONSTRAINT IF EXISTS "FK_user_certificates_user"`);
    await queryRunner.query(`ALTER TABLE "certificate_templates" DROP CONSTRAINT IF EXISTS "FK_certificate_templates_course"`);
    await queryRunner.query(`ALTER TABLE "certificate_templates" DROP CONSTRAINT IF EXISTS "FK_certificate_templates_exam_type"`);
    await queryRunner.query(`ALTER TABLE "grading_result_criterion_scores" DROP CONSTRAINT IF EXISTS "FK_grading_result_scores_criterion"`);
    await queryRunner.query(`ALTER TABLE "grading_result_criterion_scores" DROP CONSTRAINT IF EXISTS "FK_grading_result_scores_result"`);
    await queryRunner.query(`ALTER TABLE "lesson_block_items" DROP CONSTRAINT IF EXISTS "FK_lesson_block_items_version"`);
    await queryRunner.query(`ALTER TABLE "lesson_block_items" DROP CONSTRAINT IF EXISTS "FK_lesson_block_items_question"`);
    await queryRunner.query(`ALTER TABLE "lesson_block_items" DROP CONSTRAINT IF EXISTS "FK_lesson_block_items_block"`);
    await queryRunner.query(`ALTER TABLE "vocabulary_decks" DROP CONSTRAINT IF EXISTS "FK_vocabulary_decks_owner"`);
    await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT IF EXISTS "FK_assignments_created_by_user"`);
    await queryRunner.query(`ALTER TABLE "lesson_progress" DROP CONSTRAINT IF EXISTS "FK_lesson_progress_last_block"`);
    await queryRunner.query(`ALTER TABLE "grammar_topics" DROP CONSTRAINT IF EXISTS "FK_grammar_topics_canonical_topic"`);
    await queryRunner.query(`ALTER TABLE "arena_matches" DROP CONSTRAINT IF EXISTS "FK_arena_matches_season"`);
    await queryRunner.query(`ALTER TABLE "classrooms" DROP CONSTRAINT IF EXISTS "FK_classrooms_teacher_user"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "vocabulary_review_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_submissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organization_subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coupon_redemptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_daily_challenge_progress"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "daily_challenges"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "point_ledger_entries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "arena_challenges"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "arena_queue_tickets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "arena_season_standings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "arena_seasons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_certificates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "certificate_templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "grading_result_criterion_scores"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lesson_block_items"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_mastery_records_type_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_learning_path_items_type_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_arena_matches_season_id"`);
    await queryRunner.query(`ALTER TABLE "arena_matches" DROP COLUMN IF EXISTS "seasonId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_grammar_topics_canonical_topic"`);
    await queryRunner.query(`ALTER TABLE "grammar_topics" DROP COLUMN IF EXISTS "canonicalTopicId"`);
    await queryRunner.query(`ALTER TABLE "assessment_attempts" DROP COLUMN IF EXISTS "clientClockSkewMs"`);
    await queryRunner.query(`ALTER TABLE "assessment_attempts" DROP COLUMN IF EXISTS "focusLossCount"`);
    await queryRunner.query(`ALTER TABLE "assessment_attempts" DROP COLUMN IF EXISTS "lastHeartbeatAt"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "lastCalibratedAt"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "exposureCount"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "irtC"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "irtB"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "irtA"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_vocabularies_word_pos_alive"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN IF EXISTS "seatUsed"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_users_username_alive"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "username"`);
    await queryRunner.query(`UPDATE "users" SET "passwordHash" = '' WHERE "passwordHash" IS NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "classrooms" ADD COLUMN IF NOT EXISTS "teacherId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "classrooms" ADD CONSTRAINT "FK_ea22bf3c6b069755e01340f6334" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
