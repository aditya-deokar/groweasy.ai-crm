CREATE TABLE "ai_guardrail_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_job_id" uuid,
	"import_batch_id" uuid,
	"row_index" integer,
	"stage" text NOT NULL,
	"rule_id" text NOT NULL,
	"severity" text NOT NULL,
	"decision" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_model_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_job_id" uuid,
	"import_batch_id" uuid,
	"feature" text NOT NULL,
	"provider" text NOT NULL,
	"model_name" text NOT NULL,
	"prompt_id" text NOT NULL,
	"prompt_version" text NOT NULL,
	"prompt_sha256" text NOT NULL,
	"input_hash" text NOT NULL,
	"output_hash" text,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"outcome" text NOT NULL,
	"error_code" text,
	"guardrail_summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" text NOT NULL,
	"version" text NOT NULL,
	"feature" text NOT NULL,
	"sha256" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_guardrail_events" ADD CONSTRAINT "ai_guardrail_events_import_job_id_import_jobs_id_fk" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_guardrail_events" ADD CONSTRAINT "ai_guardrail_events_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_model_runs" ADD CONSTRAINT "ai_model_runs_import_job_id_import_jobs_id_fk" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_model_runs" ADD CONSTRAINT "ai_model_runs_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_guardrail_events_import_job_id_idx" ON "ai_guardrail_events" USING btree ("import_job_id");--> statement-breakpoint
CREATE INDEX "ai_guardrail_events_import_batch_id_idx" ON "ai_guardrail_events" USING btree ("import_batch_id");--> statement-breakpoint
CREATE INDEX "ai_guardrail_events_rule_idx" ON "ai_guardrail_events" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "ai_model_runs_import_job_id_idx" ON "ai_model_runs" USING btree ("import_job_id");--> statement-breakpoint
CREATE INDEX "ai_model_runs_import_batch_id_idx" ON "ai_model_runs" USING btree ("import_batch_id");--> statement-breakpoint
CREATE INDEX "ai_model_runs_created_at_idx" ON "ai_model_runs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_prompt_versions_prompt_version_idx" ON "ai_prompt_versions" USING btree ("prompt_id","version");--> statement-breakpoint
CREATE INDEX "ai_prompt_versions_feature_idx" ON "ai_prompt_versions" USING btree ("feature");