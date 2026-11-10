/**
 * Report (and optionally delete) Vercel Blob files that no product or media
 * row references anymore — leftovers from replaced photos.
 *
 * Safety:
 *  - Dry-run by default; nothing is deleted without --apply.
 *  - URLs are compared in normalized form (see normalizeBlobUrl), so a
 *    reference stored with a slightly different spelling still protects it.
 *  - Blobs uploaded less than --min-age-days ago (default 2) are never
 *    deleted: an admin may have just uploaded a photo and not saved the form.
 *  - Right before deleting, every candidate is re-checked against a fresh
 *    read of the DB; any overlap aborts the run without deleting anything.
 *
 *   npm run blob:cleanup                         # dry-run: lists orphans + sizes
 *   npm run blob:cleanup -- --apply              # delete the orphans
 *   npm run blob:cleanup -- --top 20             # also show the 20 biggest in-use files
 *   npm run blob:cleanup -- --min-age-days 7     # keep orphans younger than 7 days
 *
 * Needs BLOB_READ_WRITE_TOKEN (and DATABASE_URL) in .env.local.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { del } from "@vercel/blob";
import {
  disconnectDb,
  isReferenced,
  listAllBlobs,
  loadReferencedUrls,
  mb,
  requireBlobToken,
} from "./blob-shared";

const DEFAULT_MIN_AGE_DAYS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

function minAgeDaysArg(): number {
  const i = process.argv.indexOf("--min-age-days");
  if (i < 0) return DEFAULT_MIN_AGE_DAYS;
  const v = Number(process.argv[i + 1]);
  if (!Number.isFinite(v) || v < 0) {
    throw new Error(`--min-age-days needs a number >= 0 (got "${process.argv[i + 1] ?? ""}").`);
  }
  return v;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const topIdx = process.argv.indexOf("--top");
  const top = topIdx >= 0 ? Number(process.argv[topIdx + 1]) || 20 : 0;
  const minAgeDays = minAgeDaysArg();
  const cutoff = Date.now() - minAgeDays * DAY_MS;

  requireBlobToken();

  const [referenced, blobs] = await Promise.all([loadReferencedUrls(), listAllBlobs()]);

  const total = blobs.reduce((n, b) => n + b.size, 0);
  const inUse = blobs.filter((b) => isReferenced(b, referenced));
  const orphans = blobs.filter((b) => !isReferenced(b, referenced));
  const tooRecent = orphans.filter((b) => new Date(b.uploadedAt).getTime() > cutoff);
  const deletable = orphans.filter((b) => new Date(b.uploadedAt).getTime() <= cutoff);
  const deletableBytes = deletable.reduce((n, b) => n + b.size, 0);
  const tooRecentBytes = tooRecent.reduce((n, b) => n + b.size, 0);

  console.log(apply ? "=== APPLY BLOB CLEANUP ===" : "=== DRY RUN BLOB CLEANUP ===");
  console.log(`Blobs: ${blobs.length} (${mb(total)} MB total)`);
  console.log(`Referenced by DB: ${inUse.length}`);
  console.log(`Unreferenced: ${orphans.length}`);
  console.log(`  kept, younger than ${minAgeDays} day(s): ${tooRecent.length} (${mb(tooRecentBytes)} MB)`);
  console.log(`  deletable orphans: ${deletable.length} (${mb(deletableBytes)} MB reclaimable)`);

  if (top > 0) {
    console.log(`\nLargest ${top} files in use:`);
    [...inUse]
      .sort((a, b) => b.size - a.size)
      .slice(0, top)
      .forEach((b) => console.log(`  ${mb(b.size).padStart(7)} MB  ${b.pathname}`));
  }

  if (tooRecent.length > 0) {
    console.log(`\nKept because uploaded less than ${minAgeDays} day(s) ago:`);
    [...tooRecent]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .forEach((b) =>
        console.log(`  ${mb(b.size).padStart(7)} MB  ${new Date(b.uploadedAt).toISOString()}  ${b.pathname}`),
      );
  }

  if (deletable.length > 0 && !apply) {
    console.log("\nLargest deletable orphans:");
    [...deletable]
      .sort((a, b) => b.size - a.size)
      .slice(0, 20)
      .forEach((b) => console.log(`  ${mb(b.size).padStart(7)} MB  ${b.pathname}`));
    console.log("\nRe-run with --apply to delete them.");
  }

  if (apply && deletable.length > 0) {
    // Last line of defence: re-read the DB right before deleting, in case a
    // product was saved with one of these URLs while this script was running.
    const fresh = await loadReferencedUrls();
    const nowReferenced = deletable.filter((b) => isReferenced(b, fresh));
    if (nowReferenced.length > 0) {
      nowReferenced.forEach((b) => console.error(`  now referenced: ${b.pathname}`));
      throw new Error(`Aborted: ${nowReferenced.length} candidate(s) became referenced. Nothing was deleted.`);
    }

    for (let i = 0; i < deletable.length; i += 100) {
      await del(deletable.slice(i, i + 100).map((b) => b.url));
    }
    console.log(`\nDeleted ${deletable.length} orphan blobs, freed ~${mb(deletableBytes)} MB.`);
  }

  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
