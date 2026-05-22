ALTER TABLE "project_settings"
ADD COLUMN "error_digest_email_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "error_digest_email_time" TEXT NOT NULL DEFAULT '08:00',
ADD COLUMN "error_digest_email_timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN "error_digest_email_last_sent_at" TIMESTAMP(3);
