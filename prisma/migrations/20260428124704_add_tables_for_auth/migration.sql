-- AlterTable
ALTER TABLE "user" RENAME CONSTRAINT "users_pkey" TO "user_pkey";
ALTER TABLE "user" ALTER COLUMN "createdAt" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "name" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "emailVerified" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "users_email_key" RENAME TO "user_email_key";
