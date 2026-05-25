CREATE INDEX "request_logs_project_status_created_idx"
ON "request_logs"("project_id", "status_code", "created_at" DESC);

CREATE INDEX "request_logs_project_duration_created_idx"
ON "request_logs"("project_id", "duration_ms", "created_at" DESC);
