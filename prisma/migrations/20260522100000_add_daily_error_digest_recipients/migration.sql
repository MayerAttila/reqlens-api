ALTER TABLE "project_settings"
ADD COLUMN "error_digest_email_audience" TEXT NOT NULL DEFAULT 'admin_and_above',
ADD COLUMN "error_digest_email_custom_user_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
