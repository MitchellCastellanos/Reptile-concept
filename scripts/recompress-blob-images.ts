/**
 * Recompress oversized Vercel Blob images that are still referenced by a
 * product or media row.
 *
 * Safety:
 *  - Dry-run by default; nothing is uploaded without --apply.
 *  - Each file is overwritten at the SAME pathname (same format, same URL),
 *    so no DB row or external link changes. Vercel's CDN may keep serving the
 *    old (still valid) bytes for a while.
 *  - A file is only replaced when the result is at least --min-saving smaller.
 *  - A failure on one image is logged and the run continues.
 *
 *   npm run blob:recompress                       # dry-run
 *   npm run blob:recompress -- --apply            # overwrite for real
 *   npm run blob:recompress -- --min-kb 400       # only files above 400 KB (default 500)
 *   npm run blob:recompress -- --limit 10         # process at most 10 files
 *
 * Needs BLOB_READ_WRITE_TOKEN (and DATABASE_URL) in .env.local.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { put } from "@vercel/blob";
import sharp from "sharp";
import { disconnectDb, listAllBlobs, loadReferencedUrls, mb, requireBlobToken } from "./blob-shared";

const MAX_DIMENSION = 1600;
const MIN_SAVING = 0.1; // replace only if at least 10% smaller

function numArg(name: string, fallback: number): number {
  const i = process.argv.indexOf(name);
  const v = i >= 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

type Format = "jpeg" | "png" | "webp";

function formatFor(pathname: string): Format | null {
  const ext = pathname.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "jpeg";
  if (ext === "png") return "png";
  if (ext === "webp") return "webp";
  return null; // gif/svg/unknown: leave alone
}

async function recompress(input: Buffer, format: Format): Promise<{ data: Buffer; contentType: string }> {
  const pipeline = sharp(input)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });
  if (format === "jpeg") {
    return { data: await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer(), contentType: "image/jpeg" };
  }
  if (format === "webp") {
    return { data: await pipeline.webp({ quality: 80 }).toBuffer(), contentType: "image/webp" };
  }
  return { data: await pipeline.png({ palette: true, quality: 80, compressionLevel: 9 }).toBuffer(), contentType: "image/png" };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const minBytes = numArg("--min-kb", 500) * 1024;
  const limit = numArg("--limit", Infinity);

  requireBlobToken();

  const [referenced, blobs] = await Promise.all([loadReferencedUrls(), listAllBlobs()]);
  const candidates = blobs
    .filter((b) => referenced.has(b.url) && b.size >= minBytes && formatFor(b.pathname))
    .sort((a, b) => b.size - a.size)
    .slice(0, limit);

  console.log(apply ? "=== APPLY BLOB RECOMPRESSION ===" : "=== DRY RUN BLOB RECOMPRESSION ===");
  console.log(`Referenced blobs over ${(minBytes / 1024).toFixed(0)} KB: ${candidates.length}\n`);

  let before = 0;
  let after = 0;
  let replaced = 0;
  let skipped = 0;
  let failed = 0;

  for (const blob of candidates) {
    before += blob.size;
    try {
      const res = await fetch(blob.url);
      if (!res.ok) throw new Error(`download failed (${res.status})`);
      const original = Buffer.from(await res.arrayBuffer());
      const { data, contentType } = await recompress(original, formatFor(blob.pathname)!);

      const worthIt = data.length <= blob.size * (1 - MIN_SAVING);
      const label = `${(blob.size / 1024).toFixed(0).padStart(6)} KB -> ${(data.length / 1024).toFixed(0).padStart(6)} KB  ${blob.pathname}`;

      if (!worthIt) {
        skipped++;
        after += blob.size;
        console.log(`  skip   ${label}`);
        continue;
      }

      if (apply) {
        await put(blob.pathname, data, {
          access: "public",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType,
        });
      }
      replaced++;
      after += data.length;
      console.log(`  ${apply ? "done  " : "would "} ${label}`);
    } catch (err) {
      failed++;
      after += blob.size;
      console.error(`  FAILED ${blob.pathname}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n${apply ? "Replaced" : "Would replace"}: ${replaced}  Skipped: ${skipped}  Failed: ${failed}`);
  console.log(`Size before: ${mb(before)} MB`);
  console.log(`Size after:  ${mb(after)} MB  (${apply ? "saved" : "would save"} ${mb(before - after)} MB)`);
  if (!apply) console.log("\nRe-run with --apply to overwrite these files.");

  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
