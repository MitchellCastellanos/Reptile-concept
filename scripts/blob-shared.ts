import { list, type ListBlobResultBlob } from "@vercel/blob";

export const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

export async function listAllBlobs(): Promise<ListBlobResultBlob[]> {
  const all: ListBlobResultBlob[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000 });
    all.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return all;
}

/** Every Blob URL currently referenced by a product image or media row. */
export async function loadReferencedUrls(): Promise<Set<string>> {
  const { prisma } = await import("../src/lib/db");
  const [products, media] = await Promise.all([
    prisma.product.findMany({ where: { imageUrl: { not: null } }, select: { imageUrl: true } }),
    prisma.media.findMany({ select: { url: true } }),
  ]);
  return new Set<string>([...products.map((p) => p.imageUrl as string), ...media.map((m) => m.url)]);
}

export async function disconnectDb() {
  const { prisma } = await import("../src/lib/db");
  await prisma.$disconnect();
}

export function requireBlobToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }
}
