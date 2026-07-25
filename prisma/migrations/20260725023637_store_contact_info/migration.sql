-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "addressEn" TEXT NOT NULL DEFAULT 'Lachine, QC — by appointment',
ADD COLUMN     "addressFr" TEXT NOT NULL DEFAULT 'Lachine, QC — sur rendez-vous',
ADD COLUMN     "contactEmail" TEXT NOT NULL DEFAULT 'contact@reptileconcept.ca',
ADD COLUMN     "contactPhone" TEXT NOT NULL DEFAULT '(514) 555-0199',
ADD COLUMN     "hoursEn" TEXT NOT NULL DEFAULT 'Mon–Sat 10am–6pm',
ADD COLUMN     "hoursFr" TEXT NOT NULL DEFAULT 'Lun–Sam 10h–18h';
