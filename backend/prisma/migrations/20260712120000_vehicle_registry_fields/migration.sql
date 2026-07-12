ALTER TABLE "vehicles"
  ADD COLUMN "vehicleCode" TEXT,
  ADD COLUMN "manufacturer" TEXT,
  ADD COLUMN "model" TEXT;

UPDATE "vehicles"
SET
  "vehicleCode" = 'VEH-' || substr("id", 1, 8),
  "manufacturer" = 'Unknown',
  "model" = "name"
WHERE "vehicleCode" IS NULL;

ALTER TABLE "vehicles"
  ALTER COLUMN "vehicleCode" SET NOT NULL,
  ALTER COLUMN "manufacturer" SET NOT NULL,
  ALTER COLUMN "model" SET NOT NULL;

CREATE UNIQUE INDEX "vehicles_vehicleCode_key" ON "vehicles"("vehicleCode");
