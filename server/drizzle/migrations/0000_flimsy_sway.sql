CREATE TYPE "public"."crm_status" AS ENUM('GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE');--> statement-breakpoint
CREATE TYPE "public"."data_source" AS ENUM('leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots');--> statement-breakpoint
CREATE TYPE "public"."import_batch_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."import_job_status" AS ENUM('UPLOADED', 'PARSED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "crm_import_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_job_id" uuid NOT NULL,
	"import_row_id" uuid NOT NULL,
	"row_index" integer NOT NULL,
	"created_at_value" text,
	"name" text,
	"email" text,
	"country_code" text,
	"mobile_without_country_code" text,
	"company" text,
	"city" text,
	"state" text,
	"country" text,
	"lead_owner" text,
	"crm_status" "crm_status",
	"crm_note" text,
	"data_source" "data_source",
	"possession_time" text,
	"description" text,
	"confidence" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_skipped_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_job_id" uuid NOT NULL,
	"import_row_id" uuid NOT NULL,
	"row_index" integer NOT NULL,
	"reason" text NOT NULL,
	"raw_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_job_id" uuid NOT NULL,
	"batch_index" integer NOT NULL,
	"status" "import_batch_status" DEFAULT 'PENDING' NOT NULL,
	"row_start_index" integer NOT NULL,
	"row_end_index" integer NOT NULL,
	"row_count" integer NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"model_name" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_job_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"visible_to_user" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_file_name" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"file_sha256" text NOT NULL,
	"status" "import_job_status" DEFAULT 'UPLOADED' NOT NULL,
	"headers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"empty_row_count" integer DEFAULT 0 NOT NULL,
	"total_batches" integer DEFAULT 0 NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "import_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_job_id" uuid NOT NULL,
	"row_index" integer NOT NULL,
	"raw_data" jsonb NOT NULL,
	"raw_text_hash" text NOT NULL,
	"parse_warnings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crm_import_records" ADD CONSTRAINT "crm_import_records_import_job_id_import_jobs_id_fk" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_import_records" ADD CONSTRAINT "crm_import_records_import_row_id_import_rows_id_fk" FOREIGN KEY ("import_row_id") REFERENCES "public"."import_rows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_skipped_records" ADD CONSTRAINT "crm_skipped_records_import_job_id_import_jobs_id_fk" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_skipped_records" ADD CONSTRAINT "crm_skipped_records_import_row_id_import_rows_id_fk" FOREIGN KEY ("import_row_id") REFERENCES "public"."import_rows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_import_job_id_import_jobs_id_fk" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_events" ADD CONSTRAINT "import_events_import_job_id_import_jobs_id_fk" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_import_job_id_import_jobs_id_fk" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crm_import_records_import_job_id_idx" ON "crm_import_records" USING btree ("import_job_id");--> statement-breakpoint
CREATE INDEX "crm_import_records_email_idx" ON "crm_import_records" USING btree ("email");--> statement-breakpoint
CREATE INDEX "crm_import_records_mobile_idx" ON "crm_import_records" USING btree ("mobile_without_country_code");--> statement-breakpoint
CREATE INDEX "crm_skipped_records_import_job_id_idx" ON "crm_skipped_records" USING btree ("import_job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_skipped_records_job_row_index_idx" ON "crm_skipped_records" USING btree ("import_job_id","row_index");--> statement-breakpoint
CREATE UNIQUE INDEX "import_batches_job_batch_index_idx" ON "import_batches" USING btree ("import_job_id","batch_index");--> statement-breakpoint
CREATE INDEX "import_batches_status_idx" ON "import_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_events_import_job_id_idx" ON "import_events" USING btree ("import_job_id");--> statement-breakpoint
CREATE INDEX "import_jobs_status_idx" ON "import_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_jobs_created_at_idx" ON "import_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "import_jobs_file_sha256_idx" ON "import_jobs" USING btree ("file_sha256");--> statement-breakpoint
CREATE UNIQUE INDEX "import_rows_job_row_index_idx" ON "import_rows" USING btree ("import_job_id","row_index");--> statement-breakpoint
CREATE INDEX "import_rows_import_job_id_idx" ON "import_rows" USING btree ("import_job_id");