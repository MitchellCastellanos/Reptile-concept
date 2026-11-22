-- Customers choose how their name appears on a public review.
CREATE TYPE "ReviewNameDisplay" AS ENUM ('full', 'first_initial', 'anonymous');
ALTER TABLE "Review" ADD COLUMN "nameDisplay" "ReviewNameDisplay" NOT NULL DEFAULT 'first_initial';
