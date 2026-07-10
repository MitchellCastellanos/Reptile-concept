import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getAnimalImageUrl } from "../src/lib/images";

const DEV_ADMIN_PASSWORD = "changeme123";

async function seedMedia(animalId: string, speciesId: string) {
  const url = getAnimalImageUrl(speciesId);
  await prisma.media.upsert({
    where: { id: `seed-media-${animalId}` },
    update: { url },
    create: {
      id: `seed-media-${animalId}`,
      animalId,
      type: "photo",
      url,
      sortOrder: 0,
    },
  });
}

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

  const species = await Promise.all([
    prisma.species.upsert({
      where: { id: "seed-ball-python" },
      update: {},
      create: {
        id: "seed-ball-python",
        commonNameFr: "Python royal",
        commonNameEn: "Ball python",
        scientificName: "Python regius",
      },
    }),
    prisma.species.upsert({
      where: { id: "seed-jackson-chameleon" },
      update: {},
      create: {
        id: "seed-jackson-chameleon",
        commonNameFr: "Caméléon de Jackson",
        commonNameEn: "Jackson's chameleon",
        scientificName: "Trioceros jacksonii xantholophus",
      },
    }),
    prisma.species.upsert({
      where: { id: "seed-bearded-dragon" },
      update: {},
      create: {
        id: "seed-bearded-dragon",
        commonNameFr: "Dragon barbu",
        commonNameEn: "Bearded dragon",
        scientificName: "Pogona vitticeps",
      },
    }),
    prisma.species.upsert({
      where: { id: "seed-leopard-gecko" },
      update: {},
      create: {
        id: "seed-leopard-gecko",
        commonNameFr: "Gecko léopard",
        commonNameEn: "Leopard gecko",
        scientificName: "Eublepharis macularius",
      },
    }),
    prisma.species.upsert({
      where: { id: "seed-corn-snake" },
      update: {},
      create: {
        id: "seed-corn-snake",
        commonNameFr: "Serpent des blés",
        commonNameEn: "Corn snake",
        scientificName: "Pantherophis guttatus",
      },
    }),
    prisma.species.upsert({
      where: { id: "seed-crested-gecko" },
      update: {},
      create: {
        id: "seed-crested-gecko",
        commonNameFr: "Gecko à crête",
        commonNameEn: "Crested gecko",
        scientificName: "Correlophus ciliatus",
      },
    }),
  ]);

  const [ballPython, jacksonChameleon, beardedDragon, leopardGecko, cornSnake, crestedGecko] =
    species;

  const animals = [
    {
      id: "seed-animal-pastel",
      speciesId: ballPython.id,
      morph: "Pastel Piebald",
      sex: "male" as const,
      priceCAD: 450,
      descriptionFr: "Python royal Pastel Piebald, né en captivité, mange sans problème.",
      descriptionEn: "Pastel Piebald ball python, captive bred, feeding reliably.",
    },
    {
      id: "seed-animal-banana",
      speciesId: ballPython.id,
      morph: "Banana Mojave",
      sex: "female" as const,
      priceCAD: 520,
      descriptionFr: "Python royal Banana Mojave femelle, très docile et active.",
      descriptionEn: "Female Banana Mojave ball python, very docile and active.",
    },
    {
      id: "seed-animal-jackson",
      speciesId: jacksonChameleon.id,
      morph: "Standard",
      sex: "male" as const,
      priceCAD: 350,
      descriptionFr: "Caméléon de Jackson mâle, actif et en bonne santé.",
      descriptionEn: "Male Jackson's chameleon, active and healthy.",
    },
    {
      id: "seed-animal-bearded",
      speciesId: beardedDragon.id,
      morph: "Hypo Trans",
      sex: "female" as const,
      priceCAD: 280,
      descriptionFr: "Dragon barbu Hypo Trans, idéal pour débutants.",
      descriptionEn: "Hypo Trans bearded dragon, ideal for beginners.",
    },
    {
      id: "seed-animal-leopard",
      speciesId: leopardGecko.id,
      morph: "Tangerine",
      sex: "male" as const,
      priceCAD: 120,
      descriptionFr: "Gecko léopard Tangerine, facile à maintenir.",
      descriptionEn: "Tangerine leopard gecko, easy to care for.",
    },
    {
      id: "seed-animal-corn",
      speciesId: cornSnake.id,
      morph: "Okeetee",
      sex: "female" as const,
      priceCAD: 180,
      descriptionFr: "Serpent des blés Okeetee, excellent premier serpent.",
      descriptionEn: "Okeetee corn snake, excellent first snake.",
    },
    {
      id: "seed-animal-crested",
      speciesId: crestedGecko.id,
      morph: "Harlequin",
      sex: "unknown" as const,
      priceCAD: 95,
      descriptionFr: "Gecko à crête Harlequin, parfait pour habitat vertical.",
      descriptionEn: "Harlequin crested gecko, perfect for vertical habitats.",
    },
  ];

  for (const animal of animals) {
    await prisma.animal.upsert({
      where: { id: animal.id },
      update: {},
      create: {
        ...animal,
        status: "available",
      },
    });
    await seedMedia(animal.id, animal.speciesId);
  }

  const products = [
    {
      sku: "TERRA-40G",
      category: "terrarium" as const,
      nameFr: "Terrarium 40 gallons",
      nameEn: "40 gallon terrarium",
      descriptionFr: "Terrarium en verre avec portes frontales, idéal pour pythons et dragons.",
      descriptionEn: "Glass terrarium with front-opening doors, ideal for pythons and dragons.",
      priceCAD: 220,
      stockQty: 8,
    },
    {
      sku: "TERRA-20G",
      category: "terrarium" as const,
      nameFr: "Terrarium 20 gallons",
      nameEn: "20 gallon terrarium",
      descriptionFr: "Format compact pour geckos et jeunes reptiles.",
      descriptionEn: "Compact size for geckos and juvenile reptiles.",
      priceCAD: 145,
      stockQty: 12,
    },
    {
      sku: "SUBSTRATE-COCO",
      category: "substrate" as const,
      nameFr: "Substrat fibre de coco 5L",
      nameEn: "Coconut fiber substrate 5L",
      descriptionFr: "Substrat naturel, retient l'humidité pour espèces tropicales.",
      descriptionEn: "Natural substrate, holds humidity for tropical species.",
      priceCAD: 18,
      stockQty: 30,
    },
    {
      sku: "DECOR-BRANCH",
      category: "decor" as const,
      nameFr: "Branche de liège naturelle",
      nameEn: "Natural cork branch",
      descriptionFr: "Décoration et perchoir pour caméléons et geckos.",
      descriptionEn: "Décor and perch for chameleons and geckos.",
      priceCAD: 24,
      stockQty: 15,
    },
    {
      sku: "FOOD-CRICKET",
      category: "food_live" as const,
      nameFr: "Grillons (douzaine)",
      nameEn: "Crickets (dozen)",
      descriptionFr: "Grillons vivants, alimentés et gut-loaded.",
      descriptionEn: "Live crickets, fed and gut-loaded.",
      priceCAD: 6,
      stockQty: 50,
    },
    {
      sku: "FOOD-ROACH",
      category: "food_live" as const,
      nameFr: "Blaptica dubia (25)",
      nameEn: "Dubia roaches (25)",
      descriptionFr: "Blattes dubia, excellente source de protéines.",
      descriptionEn: "Dubia roaches, excellent protein source.",
      priceCAD: 12,
      stockQty: 40,
    },
    {
      sku: "UVB-LAMP",
      category: "decor" as const,
      nameFr: "Lampe UVB 10.0",
      nameEn: "UVB 10.0 lamp",
      descriptionFr: "Lampe UVB essentielle pour dragons et caméléons.",
      descriptionEn: "Essential UVB lamp for dragons and chameleons.",
      priceCAD: 45,
      stockQty: 20,
    },
    {
      sku: "HEAT-MAT",
      category: "decor" as const,
      nameFr: "Tapis chauffant 8W",
      nameEn: "Heat mat 8W",
      descriptionFr: "Chauffage par le bas pour serpents et geckos.",
      descriptionEn: "Under-tank heating for snakes and geckos.",
      priceCAD: 32,
      stockQty: 18,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

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
