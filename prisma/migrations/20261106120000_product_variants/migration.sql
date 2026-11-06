-- AlterTable
ALTER TABLE "Product" ADD COLUMN "parentId" TEXT,
ADD COLUMN "variantLabelFr" TEXT,
ADD COLUMN "variantLabelEn" TEXT,
ADD COLUMN "variantSortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_parentId_idx" ON "Product"("parentId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
