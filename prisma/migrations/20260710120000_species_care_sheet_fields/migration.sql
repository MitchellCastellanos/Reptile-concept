-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- AlterTable
ALTER TABLE "Species"
  ADD COLUMN "experienceLevel" "ExperienceLevel",
  ADD COLUMN "descriptionFr" TEXT,
  ADD COLUMN "descriptionEn" TEXT,
  ADD COLUMN "adultSizeFr" TEXT,
  ADD COLUMN "adultSizeEn" TEXT,
  ADD COLUMN "lifespanFr" TEXT,
  ADD COLUMN "lifespanEn" TEXT,
  ADD COLUMN "temperamentFr" TEXT,
  ADD COLUMN "temperamentEn" TEXT,
  ADD COLUMN "dietFr" TEXT,
  ADD COLUMN "dietEn" TEXT,
  ADD COLUMN "humidity" TEXT,
  ADD COLUMN "tempDay" TEXT,
  ADD COLUMN "tempNight" TEXT,
  ADD COLUMN "uvbNeeds" TEXT,
  ADD COLUMN "enclosureMinSize" TEXT,
  ADD COLUMN "substrate" TEXT,
  ADD COLUMN "feedingFrequency" TEXT,
  ADD COLUMN "handlingFr" TEXT,
  ADD COLUMN "handlingEn" TEXT;
