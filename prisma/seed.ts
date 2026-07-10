import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const DEV_ADMIN_PASSWORD = "changeme123";

async function main() {
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@reptileconcept.ca" },
    update: { passwordHash: await bcrypt.hash(DEV_ADMIN_PASSWORD, 10) },
    create: {
      email: "admin@reptileconcept.ca",
      passwordHash: await bcrypt.hash(DEV_ADMIN_PASSWORD, 10),
      role: "owner",
    },
  });

  const ballPython = await prisma.species.upsert({
    where: { id: "seed-ball-python" },
    update: {},
    create: {
      id: "seed-ball-python",
      commonNameFr: "Python royal",
      commonNameEn: "Ball python",
      scientificName: "Python regius",
    },
  });

  const jacksonChameleon = await prisma.species.upsert({
    where: { id: "seed-jackson-chameleon" },
    update: {},
    create: {
      id: "seed-jackson-chameleon",
      commonNameFr: "Caméléon de Jackson",
      commonNameEn: "Jackson's chameleon",
      scientificName: "Trioceros jacksonii xantholophus",
    },
  });

  await prisma.animal.upsert({
    where: { id: "seed-animal-pastel" },
    update: {},
    create: {
      id: "seed-animal-pastel",
      speciesId: ballPython.id,
      morph: "Pastel Piebald",
      sex: "male",
      priceCAD: 450,
      status: "available",
      descriptionFr: "Python royal Pastel Piebald, né en captivité, mange sans problème.",
      descriptionEn: "Pastel Piebald ball python, captive bred, feeding reliably.",
    },
  });

  await prisma.animal.upsert({
    where: { id: "seed-animal-jackson" },
    update: {},
    create: {
      id: "seed-animal-jackson",
      speciesId: jacksonChameleon.id,
      morph: "Standard",
      sex: "male",
      priceCAD: 350,
      status: "available",
      descriptionFr: "Caméléon de Jackson mâle, actif et en bonne santé.",
      descriptionEn: "Male Jackson's chameleon, active and healthy.",
    },
  });

  await prisma.product.upsert({
    where: { sku: "TERRA-40G" },
    update: {},
    create: {
      sku: "TERRA-40G",
      category: "terrarium",
      nameFr: "Terrarium 40 gallons",
      nameEn: "40 gallon terrarium",
      priceCAD: 220,
      stockQty: 8,
    },
  });

  await prisma.announcement.upsert({
    where: { id: "seed-announcement" },
    update: {},
    create: {
      id: "seed-announcement",
      messageFr: "Envois en pause cette semaine en raison du froid.",
      messageEn: "Shipping paused this week due to cold weather.",
      active: true,
      createdByAdminId: admin.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
