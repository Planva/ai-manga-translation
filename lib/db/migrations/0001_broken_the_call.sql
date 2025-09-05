CREATE TABLE "free_quota" (
	"date" text NOT NULL,
	"key_type" text NOT NULL,
	"key" text NOT NULL,
	"uses" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "free_quota_date_key_type_key_pk" PRIMARY KEY("date","key_type","key")
);
