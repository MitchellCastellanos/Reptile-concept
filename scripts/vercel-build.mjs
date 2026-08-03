/**
 * Vercel production build.
 *
 * Runs `prisma migrate deploy` before `next build` so schema changes land
 * automatically on every deploy — no manual step required. This needs a
 * direct (non-pooled) Postgres connection and an advisory lock; running it
 * through Neon's pgbouncer causes P1002 lock timeouts, so it only runs when
 * DIRECT_URL is set (prisma.config.ts prefers DIRECT_URL over DATABASE_URL
 * for the CLI). Set DIRECT_URL in the Vercel project's environment
 * variables — same as DATABASE_URL but without "-pooler" in the hostname.
 *
 * If DIRECT_URL isn't set, migrations are skipped and must be applied
 * manually before deploying:
 *   DIRECT_URL="postgresql://...direct-host..." npx prisma migrate deploy
 */
import { execSync } from "node:child_process";

if (process.env.DIRECT_URL) {
  console.log("[build] prisma migrate deploy");
  execSync("prisma migrate deploy", { stdio: "inherit" });
} else {
  console.warn(
    "[build] DIRECT_URL not set — skipping prisma migrate deploy. " +
      "Apply pending migrations manually before deploying, or set DIRECT_URL " +
      "in the Vercel project's environment variables to automate this.",
  );
}

console.log("[build] next build");
execSync("next build", { stdio: "inherit" });
