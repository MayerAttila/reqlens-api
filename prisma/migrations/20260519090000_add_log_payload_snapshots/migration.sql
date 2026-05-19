ALTER TABLE "request_logs"
ADD COLUMN "request_body" JSONB,
ADD COLUMN "response_body" JSONB;
