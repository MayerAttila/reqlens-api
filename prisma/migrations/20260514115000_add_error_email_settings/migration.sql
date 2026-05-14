-- AlterTable
ALTER TABLE "project_settings"
ADD COLUMN "error_email_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "error_email_recipient" TEXT;
