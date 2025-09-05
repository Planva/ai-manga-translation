ALTER TABLE "free_quota" DROP CONSTRAINT "free_quota_date_key_type_key_pk";--> statement-breakpoint
ALTER TABLE "free_quota" ADD CONSTRAINT "free_quota_date_key_pk" PRIMARY KEY("date","key");--> statement-breakpoint
ALTER TABLE "free_quota" ADD COLUMN "used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "free_quota" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "free_quota" DROP COLUMN "key_type";--> statement-breakpoint
ALTER TABLE "free_quota" DROP COLUMN "uses";