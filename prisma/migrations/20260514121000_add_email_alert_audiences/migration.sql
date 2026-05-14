-- AlterTable
ALTER TABLE "project_settings"
ADD COLUMN "latency_email_audience" TEXT NOT NULL DEFAULT 'admin_and_above',
ADD COLUMN "latency_email_custom_user_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "error_email_audience" TEXT NOT NULL DEFAULT 'admin_and_above',
ADD COLUMN "error_email_custom_user_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
