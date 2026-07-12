ALTER TABLE "profiles"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "refreshTokenHash" TEXT;

UPDATE "profiles" SET "passwordHash" = 'RESET_PASSWORD_REQUIRED' WHERE "passwordHash" IS NULL;

ALTER TABLE "profiles" ALTER COLUMN "passwordHash" SET NOT NULL;
