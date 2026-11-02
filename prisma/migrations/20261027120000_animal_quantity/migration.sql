-- AlterTable
ALTER TABLE "Animal" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN "cloverAnimalStockSync" BOOLEAN NOT NULL DEFAULT false;
