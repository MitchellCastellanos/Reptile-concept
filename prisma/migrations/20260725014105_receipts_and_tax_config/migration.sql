-- AlterTable
ALTER TABLE "FinancialRecord" ADD COLUMN     "gstAmountCAD" DECIMAL(65,30),
ADD COLUMN     "qstAmountCAD" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "gstAmountCAD" DECIMAL(65,30),
ADD COLUMN     "qstAmountCAD" DECIMAL(65,30),
ADD COLUMN     "subtotalCAD" DECIMAL(65,30),
ADD COLUMN     "totalCAD" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PosSale" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "gstAmountCAD" DECIMAL(65,30),
ADD COLUMN     "qstAmountCAD" DECIMAL(65,30),
ADD COLUMN     "subtotalCAD" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "gstRatePercent" DECIMAL(65,30) NOT NULL DEFAULT 5,
ADD COLUMN     "qstNumber" TEXT,
ADD COLUMN     "qstRatePercent" DECIMAL(65,30) NOT NULL DEFAULT 9.975;
