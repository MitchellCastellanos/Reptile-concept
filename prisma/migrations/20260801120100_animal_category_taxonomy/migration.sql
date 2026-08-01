-- CreateEnum
CREATE TYPE "AnimalCategory" AS ENUM ('reptiles_snakes', 'reptiles_lizards', 'reptiles_turtles', 'reptiles_other', 'amphibians_frogs', 'amphibians_salamanders', 'amphibians_other');

-- AlterTable
ALTER TABLE "Species" ADD COLUMN "category" "AnimalCategory" NOT NULL DEFAULT 'reptiles_other';

-- Backfill known seed species by scientific name so existing dev/staging data
-- lands in the right subcategory instead of the "other" fallback.
UPDATE "Species" SET "category" = 'reptiles_snakes' WHERE "scientificName" IN ('Python regius', 'Pantherophis guttatus');
UPDATE "Species" SET "category" = 'reptiles_lizards' WHERE "scientificName" IN ('Trioceros jacksonii xantholophus', 'Pogona vitticeps', 'Eublepharis macularius', 'Correlophus ciliatus');
