-- CreateEnum
CREATE TYPE "View" AS ENUM ('founder', 'rep');

-- CreateEnum
CREATE TYPE "CallSource" AS ENUM ('fathom', 'upload');

-- CreateEnum
CREATE TYPE "CallType" AS ENUM ('discovery', 'pitch', 'account_review', 'negotiation', 'internal');

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('won', 'lost', 'open');

-- CreateEnum
CREATE TYPE "CallRole" AS ENUM ('founder', 'rep');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('importing', 'analysing', 'ready', 'skipped', 'error');

-- CreateEnum
CREATE TYPE "MomentType" AS ENUM ('opening', 'discovery_question', 'client_need', 'objection', 'pricing', 'value_story', 'buying_signal', 'decision', 'next_steps', 'small_talk');

-- CreateEnum
CREATE TYPE "PlaybookItemType" AS ENUM ('objection', 'technique', 'question', 'story', 'buying_signal', 'awareness', 'talk_track', 'decision_rule');

-- CreateEnum
CREATE TYPE "PlaybookItemStatus" AS ENUM ('observed', 'proven', 'filtered');

-- CreateEnum
CREATE TYPE "PlaybookItemOrigin" AS ENUM ('extracted', 'inbox_answer', 'seed');

-- CreateEnum
CREATE TYPE "AwarenessLevel" AS ENUM ('unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware');

-- CreateEnum
CREATE TYPE "InboxItemType" AS ENUM ('why_prompt', 'open_question', 'filtered_item', 'call_to_review', 'ask_founder');

-- CreateEnum
CREATE TYPE "InboxItemStatus" AS ENUM ('open', 'answered', 'dismissed');

-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('spotted', 'in_conversation', 'proposal_sent', 'won', 'lost');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "auth_provider" TEXT,
    "calendar_access_granted" BOOLEAN NOT NULL DEFAULT false,
    "calendar_tokens" TEXT,
    "fathom_api_key" TEXT,
    "fathom_webhook_id" TEXT,
    "fathom_webhook_secret" TEXT,
    "current_view" "View" NOT NULL DEFAULT 'founder',
    "onboarded_at" TIMESTAMP(3),
    "rep_welcomed_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_contexts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "profile_summary" JSONB,
    "approved_at" TIMESTAMP(3),
    "prompt_version" TEXT,

    CONSTRAINT "business_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "source" "CallSource" NOT NULL,
    "fathom_recording_id" TEXT,
    "title" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "duration_s" INTEGER NOT NULL,
    "transcript" JSONB NOT NULL,
    "attendee_emails" TEXT[],
    "client_domain" TEXT,
    "media_url" TEXT,
    "call_type" "CallType",
    "outcome" "CallOutcome" NOT NULL DEFAULT 'open',
    "role" "CallRole" NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'importing',
    "error_message" TEXT,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "call_id" TEXT NOT NULL,
    "type" "MomentType" NOT NULL,
    "start_s" DOUBLE PRECISION NOT NULL,
    "end_s" DOUBLE PRECISION NOT NULL,
    "speaker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playbook_items" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "type" "PlaybookItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source_moment_ids" TEXT[],
    "status" "PlaybookItemStatus" NOT NULL DEFAULT 'observed',
    "filter_reason" TEXT,
    "overridden_by_founder" BOOLEAN NOT NULL DEFAULT false,
    "win_count" INTEGER NOT NULL DEFAULT 0,
    "origin" "PlaybookItemOrigin" NOT NULL DEFAULT 'extracted',

    CONSTRAINT "playbook_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rubric" TEXT NOT NULL,
    "applies_to_call_types" "CallType"[],
    "requires_objection" BOOLEAN NOT NULL DEFAULT false,
    "computed" BOOLEAN NOT NULL DEFAULT false,
    "order_in_path" INTEGER NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_progress" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "habit_id" TEXT NOT NULL,
    "is_focus" BOOLEAN NOT NULL DEFAULT false,
    "streak" BOOLEAN[] DEFAULT ARRAY[]::BOOLEAN[],
    "mastered_at" TIMESTAMP(3),
    "celebrated_at" TIMESTAMP(3),

    CONSTRAINT "habit_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scorecards" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "call_id" TEXT NOT NULL,
    "call_type" "CallType" NOT NULL,
    "total" INTEGER NOT NULL,
    "habit_results" JSONB NOT NULL,
    "awareness_level" "AwarenessLevel",
    "awareness_matched" BOOLEAN,
    "benchmark_total" INTEGER,
    "prompt_version" TEXT,

    CONSTRAINT "scorecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "self_reviews" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "call_id" TEXT NOT NULL,
    "rating" INTEGER,
    "redo_note" TEXT,
    "skipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "self_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "call_id" TEXT NOT NULL,
    "strengths" TEXT[],
    "improvements" TEXT[],
    "objections" JSONB NOT NULL,
    "missed_opportunities" JSONB NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placeholder_clips" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "moment_type" "MomentType" NOT NULL,
    "title" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "start_s" DOUBLE PRECISION NOT NULL,
    "end_s" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "placeholder_clips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparisons" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "call_id" TEXT NOT NULL,
    "rep_moment_id" TEXT NOT NULL,
    "founder_moment_id" TEXT,
    "placeholder_clip_id" TEXT,
    "match_score" DOUBLE PRECISION,
    "difference_note" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "not_relevant" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founder_comments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "call_id" TEXT NOT NULL,
    "moment_id" TEXT NOT NULL,
    "text" TEXT,
    "audio_url" TEXT,

    CONSTRAINT "founder_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_items" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "type" "InboxItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "status" "InboxItemStatus" NOT NULL DEFAULT 'open',
    "answer_text" TEXT,
    "answer_audio_url" TEXT,
    "answered_at" TIMESTAMP(3),
    "dedupe_key" TEXT,
    "source_call_id" TEXT,
    "source_moment_id" TEXT,
    "source_playbook_item_id" TEXT,
    "created_playbook_item_id" TEXT,

    CONSTRAINT "inbox_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "call_id" TEXT,
    "moment_id" TEXT,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "next_step" TEXT,
    "due_date" TIMESTAMP(3),
    "value_estimate" INTEGER,
    "stage" "OpportunityStage" NOT NULL DEFAULT 'spotted',
    "final_value" INTEGER,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ask_questions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "source_item_ids" TEXT[],
    "routed_to_inbox" BOOLEAN NOT NULL DEFAULT false,
    "inbox_item_id" TEXT,

    CONSTRAINT "ask_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_usages" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "call_id" TEXT,
    "step" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_version" TEXT,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,

    CONSTRAINT "model_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "business_contexts_version_key" ON "business_contexts"("version");

-- CreateIndex
CREATE UNIQUE INDEX "calls_fathom_recording_id_key" ON "calls"("fathom_recording_id");

-- CreateIndex
CREATE INDEX "calls_role_status_idx" ON "calls"("role", "status");

-- CreateIndex
CREATE INDEX "calls_client_domain_idx" ON "calls"("client_domain");

-- CreateIndex
CREATE INDEX "moments_call_id_idx" ON "moments"("call_id");

-- CreateIndex
CREATE INDEX "moments_type_idx" ON "moments"("type");

-- CreateIndex
CREATE INDEX "playbook_items_status_type_idx" ON "playbook_items"("status", "type");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "habits_code_key" ON "habits"("code");

-- CreateIndex
CREATE UNIQUE INDEX "habit_progress_habit_id_key" ON "habit_progress"("habit_id");

-- CreateIndex
CREATE UNIQUE INDEX "scorecards_call_id_key" ON "scorecards"("call_id");

-- CreateIndex
CREATE UNIQUE INDEX "self_reviews_call_id_key" ON "self_reviews"("call_id");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_call_id_key" ON "feedback"("call_id");

-- CreateIndex
CREATE UNIQUE INDEX "placeholder_clips_moment_type_key" ON "placeholder_clips"("moment_type");

-- CreateIndex
CREATE INDEX "comparisons_call_id_idx" ON "comparisons"("call_id");

-- CreateIndex
CREATE INDEX "founder_comments_call_id_idx" ON "founder_comments"("call_id");

-- CreateIndex
CREATE UNIQUE INDEX "inbox_items_dedupe_key_key" ON "inbox_items"("dedupe_key");

-- CreateIndex
CREATE INDEX "inbox_items_status_priority_idx" ON "inbox_items"("status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "ask_questions_inbox_item_id_key" ON "ask_questions"("inbox_item_id");

-- CreateIndex
CREATE INDEX "model_usages_call_id_idx" ON "model_usages"("call_id");

-- AddForeignKey
ALTER TABLE "moments" ADD CONSTRAINT "moments_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_progress" ADD CONSTRAINT "habit_progress_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scorecards" ADD CONSTRAINT "scorecards_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "self_reviews" ADD CONSTRAINT "self_reviews_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_rep_moment_id_fkey" FOREIGN KEY ("rep_moment_id") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_founder_moment_id_fkey" FOREIGN KEY ("founder_moment_id") REFERENCES "moments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_placeholder_clip_id_fkey" FOREIGN KEY ("placeholder_clip_id") REFERENCES "placeholder_clips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_comments" ADD CONSTRAINT "founder_comments_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_comments" ADD CONSTRAINT "founder_comments_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_source_call_id_fkey" FOREIGN KEY ("source_call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_source_moment_id_fkey" FOREIGN KEY ("source_moment_id") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_source_playbook_item_id_fkey" FOREIGN KEY ("source_playbook_item_id") REFERENCES "playbook_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ask_questions" ADD CONSTRAINT "ask_questions_inbox_item_id_fkey" FOREIGN KEY ("inbox_item_id") REFERENCES "inbox_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_usages" ADD CONSTRAINT "model_usages_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;
