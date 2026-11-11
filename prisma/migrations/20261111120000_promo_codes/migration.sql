-- AlterTable
ALTER TABLE "Order" ADD COLUMN "promoCode" TEXT,
ADD COLUMN "discountCAD" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percentOff" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "firstPurchaseOnly" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- Launch offer for newsletter subscribers: 15% off the first purchase, valid
-- through December 31st, 2026 (cutoff = Jan 1st 2027 00:00 America/Montreal).
INSERT INTO "PromoCode" ("id", "code", "percentOff", "expiresAt", "firstPurchaseOnly", "active")
VALUES (gen_random_uuid()::text, 'BIENVENUE15', 15, '2027-01-01 05:00:00', true, true);
