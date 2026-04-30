DROP INDEX IF EXISTS "api_keys_project_id_idx";
CREATE UNIQUE INDEX "api_keys_project_id_key" ON "api_keys"("project_id");
