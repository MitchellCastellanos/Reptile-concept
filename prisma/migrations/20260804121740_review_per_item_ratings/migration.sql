/*
  Warnings:

  - You are about to drop the column `animalId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Review` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_animalId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_productId_fkey";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "animalId",
DROP COLUMN "productId";

-- CreateTable
CREATE TABLE "ReviewItemRating" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "animalId" TEXT,
    "productId" TEXT,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "ReviewItemRating_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReviewItemRating" ADD CONSTRAINT "ReviewItemRating_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItemRating" ADD CONSTRAINT "ReviewItemRating_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItemRating" ADD CONSTRAINT "ReviewItemRating_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
