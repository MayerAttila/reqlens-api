-- CreateTable
CREATE TABLE "project_settings" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "latency_error_threshold_ms" INTEGER NOT NULL DEFAULT 750,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_settings_project_id_key" ON "project_settings"("project_id");

-- AddForeignKey
ALTER TABLE "project_settings" ADD CONSTRAINT "project_settings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BackfillSettings
INSERT INTO "project_settings" (
    "id",
    "project_id",
    "latency_error_threshold_ms",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    "id",
    750,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "projects"
ON CONFLICT ("project_id") DO NOTHING;
