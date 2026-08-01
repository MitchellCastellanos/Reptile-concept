-- AlterTable
ALTER TABLE "Product" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;

-- Demo/seed products without a Clover link can stay visible on the storefront.
UPDATE "Product" SET "published" = true WHERE "cloverItemId" IS NULL;
