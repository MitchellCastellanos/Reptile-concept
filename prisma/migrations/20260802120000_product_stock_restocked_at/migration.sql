-- Track when a product goes from zero stock back in stock (for "Back in stock" badge).
ALTER TABLE "Product" ADD COLUMN "stockRestockedAt" TIMESTAMP(3);
