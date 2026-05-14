-- AlterTable
ALTER TABLE "project_settings"
ADD COLUMN "latency_email_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "latency_email_recipient" TEXT;
