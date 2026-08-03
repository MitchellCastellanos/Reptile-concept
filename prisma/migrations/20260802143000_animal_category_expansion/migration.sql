-- Expand animal browse taxonomy: geckos split from lizards, invertebrates group added.
ALTER TYPE "AnimalCategory" ADD VALUE IF NOT EXISTS 'reptiles_geckos';
ALTER TYPE "AnimalCategory" ADD VALUE IF NOT EXISTS 'invertebrates_arachnids';
ALTER TYPE "AnimalCategory" ADD VALUE IF NOT EXISTS 'invertebrates_insects';
ALTER TYPE "AnimalCategory" ADD VALUE IF NOT EXISTS 'invertebrates_other';

-- Seed species → geckos
UPDATE "Species" SET "category" = 'reptiles_geckos'
WHERE "id" IN ('seed-leopard-gecko', 'seed-crested-gecko')
   OR "scientificName" IN ('Eublepharis macularius', 'Correlophus ciliatus');

-- Clover placeholder species
UPDATE "Species" SET "category" = 'invertebrates_arachnids' WHERE "id" = 'clover-species-arachnide';

INSERT INTO "Species" ("id", "commonNameFr", "commonNameEn", "scientificName", "category", "createdAt", "updatedAt")
VALUES
  ('clover-species-gecko', 'Gecko', 'Gecko', 'Gekkota sp.', 'reptiles_geckos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('clover-species-insect', 'Insecte', 'Insect', 'Insecta sp.', 'invertebrates_insects', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('clover-species-invertebrate', 'Invertébré', 'Invertebrate', 'Invertebrata sp.', 'invertebrates_other', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET "category" = EXCLUDED."category";
