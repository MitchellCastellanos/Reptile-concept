import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let client: PrismaClient | undefined = globalForPrisma.prisma;

// Lazily construct the client on first real use instead of at module-import
// time. Routes that only *import* `prisma` transitively (e.g. via
// lib/auth.ts) but never call it shouldn't crash Next's build-time "collect
// page data" step just because DATABASE_URL isn't set in that environment.
function getPrismaClient(): PrismaClient {
  if (client) return client;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const real = getPrismaClient();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
