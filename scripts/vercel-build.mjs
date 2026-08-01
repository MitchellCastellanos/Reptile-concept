/**
 * Vercel production build.
 *
 * Migrations are NOT run here — prisma migrate deploy needs a direct (non-pooled)
 * Postgres connection and an advisory lock. Running it through Neon pgbouncer during
 * Vercel build causes P1002 lock timeouts.
 *
 * Before deploying schema changes, run locally:
 *   DIRECT_URL="postgresql://...direct-host..." npx prisma migrate deploy
 */
import { execSync } from "node:child_process";

console.log("[build] next build");
execSync("next build", { stdio: "inherit" });
