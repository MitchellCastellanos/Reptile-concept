-- AlterEnum
ALTER TYPE "FinancialChannel" ADD VALUE 'clover_pos';

-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "cloverItemId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "cloverItemId" TEXT;

-- AlterTable
ALTER TABLE "FinancialRecord" ADD COLUMN     "cloverSaleId" TEXT;

-- CreateTable
CREATE TABLE "CloverSale" (
    "id" TEXT NOT NULL,
    "cloverOrderId" TEXT NOT NULL,
    "cloverPaymentId" TEXT,
    "amountCAD" DECIMAL(65,30) NOT NULL,
    "paymentMethod" "PosPaymentMethod",
    "cloverCreatedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloverSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloverSaleItem" (
    "id" TEXT NOT NULL,
    "cloverSaleId" TEXT NOT NULL,
    "animalId" TEXT,
    "productId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceAtSaleCAD" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "CloverSaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloverWebhookEvent" (
    "id" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloverWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloverSyncState" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "lastPolledAt" TIMESTAMP(3),
    "lastVerificationCode" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloverSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Animal_cloverItemId_key" ON "Animal"("cloverItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_cloverItemId_key" ON "Product"("cloverItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CloverSale_cloverOrderId_key" ON "CloverSale"("cloverOrderId");

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_cloverSaleId_fkey" FOREIGN KEY ("cloverSaleId") REFERENCES "CloverSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloverSaleItem" ADD CONSTRAINT "CloverSaleItem_cloverSaleId_fkey" FOREIGN KEY ("cloverSaleId") REFERENCES "CloverSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloverSaleItem" ADD CONSTRAINT "CloverSaleItem_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloverSaleItem" ADD CONSTRAINT "CloverSaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
