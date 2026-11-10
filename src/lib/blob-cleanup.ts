import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { isBlobUrl, isOwnStoreUrl, normalizeBlobUrl } from "@/lib/blob-url";

export { isBlobUrl };

/**
 * Of the given URLs, returns the ones that are safe to delete: hosted on this
 * app's own Blob store and not referenced by ANY product image or media row.
 * Read-only. References are compared in normalized form, so a URL stored with
 * a different spelling (scheme, host case, query string, %-encoding) still
 * protects its blob.
 */
export async function findUnusedBlobUrls(urls: Array<string | null | undefined>): Promise<string[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return [];
  const candidates = [...new Set(urls.filter(isBlobUrl))].filter((u) => isOwnStoreUrl(u, token));
  if (candidates.length === 0) return [];

  const [products, media] = await Promise.all([
    prisma.product.findMany({ where: { imageUrl: { not: null } }, select: { imageUrl: true } }),
    prisma.media.findMany({ select: { url: true } }),
  ]);
  const inUse = new Set<string>(
    [...products.map((p) => p.imageUrl as string), ...media.map((m) => m.url)].map(normalizeBlobUrl),
  );
  return candidates.filter((u) => !inUse.has(normalizeBlobUrl(u)));
}

/**
 * Deletes Vercel Blob files that were attached to a record before an edit
 * and are no longer referenced by any product or media row. Call it AFTER the
 * database change, so the "still in use?" check sees the new state. Never
 * throws: a failed cleanup must not break the save that triggered it.
 */
export async function releaseUnusedBlobs(urls: Array<string | null | undefined>) {
  try {
    const orphans = await findUnusedBlobUrls(urls);
    if (orphans.length > 0) await del(orphans);
  } catch (err) {
    console.error("[blob-cleanup] failed to delete unused blobs:", err);
  }
}
