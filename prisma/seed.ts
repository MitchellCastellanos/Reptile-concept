import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const DEV_ADMIN_PASSWORD = "changeme123";

async function main() {
  await prisma.adminUser.upsert({
    where: { email: "admin@reptileconcept.ca" },
    update: { passwordHash: await bcrypt.hash(DEV_ADMIN_PASSWORD, 10) },
    create: {
      email: "admin@reptileconcept.ca",
      passwordHash: await bcrypt.hash(DEV_ADMIN_PASSWORD, 10),
      role: "owner",
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
