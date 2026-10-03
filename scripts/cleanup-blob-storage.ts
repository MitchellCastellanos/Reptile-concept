/**
 * Report (and optionally delete) Vercel Blob files that no product or media
 * row references anymore — leftovers from replaced photos.
 *
 *   npm run blob:cleanup                  # dry-run: lists orphans + sizes
 *   npm run blob:cleanup -- --apply       # delete the orphans
 *   npm run blob:cleanup -- --top 20      # also show the 20 biggest in-use files
 *
 * Needs BLOB_READ_WRITE_TOKEN (and DATABASE_URL) in .env.local.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { list, del, type ListBlobResultBlob } from "@vercel/blob";

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

async function listAllBlobs(): Promise<ListBlobResultBlob[]> {
  const all: ListBlobResultBlob[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000 });
    all.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return all;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const topIdx = process.argv.indexOf("--top");
  const top = topIdx >= 0 ? Number(process.argv[topIdx + 1]) || 20 : 0;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }

  const { prisma } = await import("../src/lib/db");
  const [products, media, blobs] = await Promise.all([
    prisma.product.findMany({ where: { imageUrl: { not: null } }, select: { imageUrl: true } }),
    prisma.media.findMany({ select: { url: true } }),
    listAllBlobs(),
  ]);

  const referenced = new Set<string>([
    ...products.map((p) => p.imageUrl as string),
    ...media.map((m) => m.url),
  ]);

  const total = blobs.reduce((n, b) => n + b.size, 0);
  const orphans = blobs.filter((b) => !referenced.has(b.url));
  const orphanBytes = orphans.reduce((n, b) => n + b.size, 0);

  console.log(apply ? "=== APPLY BLOB CLEANUP ===" : "=== DRY RUN BLOB CLEANUP ===");
  console.log(`Blobs: ${blobs.length} (${mb(total)} MB total)`);
  console.log(`Referenced by DB: ${blobs.length - orphans.length}`);
  console.log(`Orphans: ${orphans.length} (${mb(orphanBytes)} MB reclaimable)`);

  if (top > 0) {
    console.log(`\nLargest ${top} files in use:`);
    blobs
      .filter((b) => referenced.has(b.url))
      .sort((a, b) => b.size - a.size)
      .slice(0, top)
      .forEach((b) => console.log(`  ${mb(b.size).padStart(7)} MB  ${b.pathname}`));
  }

  if (orphans.length > 0 && !apply) {
    console.log("\nLargest orphans:");
    [...orphans]
      .sort((a, b) => b.size - a.size)
      .slice(0, 20)
      .forEach((b) => console.log(`  ${mb(b.size).padStart(7)} MB  ${b.pathname}`));
    console.log("\nRe-run with --apply to delete them.");
  }

  if (apply && orphans.length > 0) {
    for (let i = 0; i < orphans.length; i += 100) {
      await del(orphans.slice(i, i + 100).map((b) => b.url));
    }
    console.log(`\nDeleted ${orphans.length} orphan blobs, freed ~${mb(orphanBytes)} MB.`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
