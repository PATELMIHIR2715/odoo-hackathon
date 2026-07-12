CREATE TYPE "VehicleType" AS ENUM (
  'VAN',
  'TRUCK',
  'MINI',
  'CAR',
  'BUS',
  'SUV',
  'PICKUP',
  'OTHER'
);

ALTER TABLE "vehicles"
  ALTER COLUMN "type" DROP DEFAULT,
  ALTER COLUMN "type" TYPE "VehicleType"
  USING (
    CASE LOWER(BTRIM("type"))
      WHEN 'van' THEN 'VAN'
      WHEN 'truck' THEN 'TRUCK'
      WHEN 'mini' THEN 'MINI'
      WHEN 'car' THEN 'CAR'
      WHEN 'bus' THEN 'BUS'
      WHEN 'suv' THEN 'SUV'
      WHEN 'pickup' THEN 'PICKUP'
      ELSE 'OTHER'
    END
  )::"VehicleType";
