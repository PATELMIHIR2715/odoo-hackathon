ALTER TABLE "profiles"
ADD COLUMN "moduleAccess" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "profiles"
SET "moduleAccess" = CASE
  WHEN "role" = 'ADMIN' THEN ARRAY['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuel_expenses', 'analytics', 'settings']::TEXT[]
  WHEN "role" = 'FLEET_MANAGER' THEN ARRAY['dashboard', 'fleet', 'drivers', 'maintenance', 'analytics']::TEXT[]
  WHEN "role" = 'DRIVER' THEN ARRAY['dashboard', 'trips']::TEXT[]
  WHEN "role" = 'SAFETY_OFFICER' THEN ARRAY['dashboard', 'drivers', 'trips']::TEXT[]
  WHEN "role" = 'FINANCIAL_ANALYST' THEN ARRAY['dashboard', 'fleet', 'fuel_expenses', 'analytics']::TEXT[]
  ELSE ARRAY['dashboard']::TEXT[]
END;
