ALTER TABLE "projects" ADD COLUMN "key_hash" TEXT;
ALTER TABLE "projects" ADD COLUMN "encrypted_key" TEXT;

UPDATE "projects"
SET
  "key_hash" = "api_keys"."key_hash",
  "encrypted_key" = "api_keys"."encrypted_key"
FROM "api_keys"
WHERE "api_keys"."project_id" = "projects"."id";

CREATE UNIQUE INDEX "projects_key_hash_key" ON "projects"("key_hash");

DROP TABLE "api_keys";
