-- CreateTable
CREATE TABLE "organization_settings" (
    "id" INTEGER NOT NULL,
    "orgName" TEXT NOT NULL,
    "depotName" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "distanceUnit" TEXT NOT NULL DEFAULT 'KM',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Colombo',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);
