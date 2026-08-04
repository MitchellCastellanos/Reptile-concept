// One-off CLI to add (or reset the password of) an AdminUser — use this to
// give yourself a personal admin login independent of the client's, so
// changing their password never locks you out. Run against whichever
// DATABASE_URL is in your environment (point it at prod to create the
// account there, same pattern as `npm run db:seed`).
//
// Usage: npm run admin:create -- --email you@example.com --password 'xxx' [--role owner|staff]
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

function arg(name: string): string | undefined {
  const flag = `--${name}`;
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const email = arg("email");
  const password = arg("password");
  const role = arg("role") === "staff" ? "staff" : "owner";

  if (!email || !password) {
    console.error("Usage: npm run admin:create -- --email you@example.com --password 'xxx' [--role owner|staff]");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash: await bcrypt.hash(password, 10), role },
    create: { email, passwordHash: await bcrypt.hash(password, 10), role },
  });

  console.log(`Admin account ready: ${admin.email} (role: ${admin.role})`);
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
