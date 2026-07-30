-- CreateEnum
CREATE TYPE "CloverImportCandidateStatus" AS ENUM ('pending', 'created', 'ignored');

-- CreateTable
CREATE TABLE "CloverImportCandidate" (
    "id" TEXT NOT NULL,
    "cloverItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCAD" DECIMAL(65,30) NOT NULL,
    "cloverCategoryName" TEXT,
    "stockCount" INTEGER,
    "status" "CloverImportCandidateStatus" NOT NULL DEFAULT 'pending',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloverImportCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CloverImportCandidate_cloverItemId_key" ON "CloverImportCandidate"("cloverItemId");
