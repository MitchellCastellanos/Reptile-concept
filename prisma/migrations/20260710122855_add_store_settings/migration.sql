-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "phone" TEXT NOT NULL DEFAULT '',
    "addressFr" TEXT NOT NULL DEFAULT '',
    "addressEn" TEXT NOT NULL DEFAULT '',
    "hoursMon" TEXT NOT NULL DEFAULT 'Fermé / Closed',
    "hoursTue" TEXT NOT NULL DEFAULT 'Fermé / Closed',
    "hoursWed" TEXT NOT NULL DEFAULT 'Fermé / Closed',
    "hoursThu" TEXT NOT NULL DEFAULT 'Fermé / Closed',
    "hoursFri" TEXT NOT NULL DEFAULT 'Fermé / Closed',
    "hoursSat" TEXT NOT NULL DEFAULT 'Fermé / Closed',
    "hoursSun" TEXT NOT NULL DEFAULT 'Fermé / Closed',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row with the store's real contact info / hours
INSERT INTO "StoreSettings"
  ("id", "phone", "addressFr", "addressEn", "hoursMon", "hoursTue", "hoursWed", "hoursThu", "hoursFri", "hoursSat", "hoursSun", "updatedAt")
VALUES
  (1, '+1 (514) 634-9360', 'Lachine, QC — sur rendez-vous', 'Lachine, QC — by appointment', 'Fermé', '11h00–18h00', '11h00–18h00', '11h00–20h00', '11h00–20h00', '11h00–17h00', 'Fermé', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
