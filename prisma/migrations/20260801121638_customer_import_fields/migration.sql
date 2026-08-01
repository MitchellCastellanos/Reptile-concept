-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "customerType" TEXT,
ADD COLUMN     "currentBalanceCAD" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "attachmentsNote" TEXT;
