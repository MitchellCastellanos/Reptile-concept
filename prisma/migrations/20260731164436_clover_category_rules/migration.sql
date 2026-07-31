-- CreateEnum
CREATE TYPE "CloverCategoryRuleAction" AS ENUM ('auto_product', 'ignore');

-- CreateTable
CREATE TABLE "CloverCategoryRule" (
    "id" TEXT NOT NULL,
    "cloverCategoryName" TEXT NOT NULL,
    "action" "CloverCategoryRuleAction" NOT NULL,
    "productCategory" "ProductCategory",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloverCategoryRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CloverCategoryRule_cloverCategoryName_key" ON "CloverCategoryRule"("cloverCategoryName");
