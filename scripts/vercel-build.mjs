/**
 * Vercel build — prisma migrate deploy can time out on Neon cold starts or
 * concurrent deploys (advisory lock). Retry with a longer lock timeout.
 */
import { execSync } from "node:child_process";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 8000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runMigrate(attempt) {
  console.log(`[build] prisma migrate deploy (attempt ${attempt}/${MAX_ATTEMPTS})`);
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT: "60000",
    },
  });
}

async function main() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      runMigrate(attempt);
      break;
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw err;
      console.warn(`[build] migrate failed, retrying in ${RETRY_DELAY_MS / 1000}s…`);
      await sleep(RETRY_DELAY_MS);
    }
  }

  console.log("[build] next build");
  execSync("next build", { stdio: "inherit" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
