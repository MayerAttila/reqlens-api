CREATE TABLE "account_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "default_latency_error_threshold_ms" INTEGER NOT NULL DEFAULT 750,
    "default_latency_email_audience" TEXT NOT NULL DEFAULT 'admin_and_above',
    "default_error_email_audience" TEXT NOT NULL DEFAULT 'admin_and_above',
    "default_error_digest_email_audience" TEXT NOT NULL DEFAULT 'admin_and_above',
    "default_error_digest_email_time" TEXT NOT NULL DEFAULT '08:00',
    "default_error_digest_email_timezone" TEXT NOT NULL DEFAULT 'UTC',
    "default_invite_role" TEXT NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "account_settings_user_id_key" ON "account_settings"("user_id");

ALTER TABLE "account_settings" ADD CONSTRAINT "account_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
