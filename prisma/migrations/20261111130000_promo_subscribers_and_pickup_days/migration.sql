-- Promo codes can be limited to active newsletter subscribers (the launch
-- code BIENVENUE15 is a subscriber-only gift).
ALTER TABLE "PromoCode" ADD COLUMN "subscribersOnly" BOOLEAN NOT NULL DEFAULT false;
UPDATE "PromoCode" SET "subscribersOnly" = true WHERE "code" = 'BIENVENUE15';

-- Standard pickup window is now 5 business days (live food: 48 h, handled in code).
-- Only bumps stores still on the old default of 4.
ALTER TABLE "StoreSettings" ALTER COLUMN "pickupDeadlineBusinessDays" SET DEFAULT 5;
UPDATE "StoreSettings" SET "pickupDeadlineBusinessDays" = 5 WHERE "pickupDeadlineBusinessDays" = 4;
