import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";

const BLOB_HOST = /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//;

export function isBlobUrl(url: string | null | undefined): url is string {
  return Boolean(url && BLOB_HOST.test(url));
}

/**
 * Deletes Vercel Blob files that were attached to a record before an edit
 * and are no longer referenced by any product or media row. Never throws:
 * a failed cleanup must not break the save that triggered it.
 */
export async function releaseUnusedBlobs(urls: Array<string | null | undefined>) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return;
    const candidates = [...new Set(urls.filter(isBlobUrl))];
    if (candidates.length === 0) return;

    const [products, media] = await Promise.all([
      prisma.product.findMany({ where: { imageUrl: { in: candidates } }, select: { imageUrl: true } }),
      prisma.media.findMany({ where: { url: { in: candidates } }, select: { url: true } }),
    ]);
    const inUse = new Set<string>([
      ...products.map((p) => p.imageUrl as string),
      ...media.map((m) => m.url),
    ]);
    const orphans = candidates.filter((u) => !inUse.has(u));
    if (orphans.length > 0) await del(orphans);
  } catch (err) {
    console.error("[blob-cleanup] failed to delete unused blobs:", err);
  }
}
