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
 * Neon + parallel Vercel builds can still hit P1002 (advisory lock timeout).
 * We retry a few times with a longer lock window before failing the build.
 *
 * If DIRECT_URL isn't set, migrations are skipped and must be applied
 * manually before deploying:
 *   DIRECT_URL="postgresql://...direct-host..." npx prisma migrate deploy
 */
import { execSync } from "node:child_process";
import { setTimeout } from "node:timers/promises";

const MIGRATE_LOCK_TIMEOUT_MS =
  process.env.PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT ?? "60000";
const MIGRATE_MAX_ATTEMPTS = 3;
const MIGRATE_RETRY_DELAY_MS = 8000;

async function migrateDeployWithRetry() {
  for (let attempt = 1; attempt <= MIGRATE_MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[build] prisma migrate deploy (attempt ${attempt}/${MIGRATE_MAX_ATTEMPTS})`);
      execSync("prisma migrate deploy", {
        stdio: "inherit",
        env: {
          ...process.env,
          PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT: MIGRATE_LOCK_TIMEOUT_MS,
        },
      });
      return;
    } catch (err) {
      if (attempt >= MIGRATE_MAX_ATTEMPTS) throw err;
      console.warn(
        `[build] prisma migrate deploy failed (attempt ${attempt}), retrying in ${MIGRATE_RETRY_DELAY_MS / 1000}s…`,
      );
      await setTimeout(MIGRATE_RETRY_DELAY_MS);
    }
  }
}

async function main() {
  if (process.env.DIRECT_URL) {
    await migrateDeployWithRetry();
  } else {
    console.warn(
      "[build] DIRECT_URL not set — skipping prisma migrate deploy. " +
        "Apply pending migrations manually before deploying, or set DIRECT_URL " +
        "in the Vercel project's environment variables to automate this.",
    );
  }

  console.log("[build] next build");
  execSync("next build", { stdio: "inherit" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
