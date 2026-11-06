import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Storefront listings only show top-level products — a variant (a size
 * option such as "Pinky" / "Adulte") is reached through its parent's page.
 */
export const TOP_LEVEL_PRODUCT = { parentId: null } as const;

/**
 * A parent product with variants is just a container: its price is the
 * cheapest variant's ("from X $") and its stock is the sum of its variants',
 * so every existing in-stock filter, badge and card keeps working. Call this
 * after anything that changes a variant's stock or price.
 */
export async function syncVariantParent(
  db: Db,
  parentId: string | null | undefined,
): Promise<{ parentRestocked: boolean }> {
  if (!parentId) return { parentRestocked: false };
  const parent = await db.product.findUnique({ where: { id: parentId }, select: { stockQty: true } });
  const variants = await db.product.findMany({
    where: { parentId },
    select: { priceCAD: true, stockQty: true, stockRestockedAt: true },
  });
  if (!parent || variants.length === 0) return { parentRestocked: false };

  const inStock = variants.filter((v) => v.stockQty > 0);
  const stockQty = inStock.reduce((sum, v) => sum + v.stockQty, 0);
  const priced = inStock.length > 0 ? inStock : variants;
  const priceCAD = Math.min(...priced.map((v) => Number(v.priceCAD)));
  const restockedAt = inStock
    .map((v) => v.stockRestockedAt?.getTime() ?? 0)
    .reduce((max, t) => Math.max(max, t), 0);

  await db.product.update({
    where: { id: parentId },
    data: { stockQty, priceCAD, stockRestockedAt: stockQty > 0 && restockedAt ? new Date(restockedAt) : null },
  });
  // Customers subscribe to "notify me" on the parent page, so the parent
  // going 0 → in stock is the moment to email them.
  return { parentRestocked: parent.stockQty <= 0 && stockQty > 0 };
}

/** Same as syncVariantParent, but starting from a variant's own id. */
export async function syncParentOfProduct(db: Db, productId: string) {
  const product = await db.product.findUnique({ where: { id: productId }, select: { parentId: true } });
  const result = await syncVariantParent(db, product?.parentId);
  return { parentId: product?.parentId ?? null, ...result };
}

export type VariantInput = {
  id?: string;
  labelFr: string;
  labelEn: string;
  sku: string;
  priceCAD: number;
  stockQty: number;
  cloverItemId: string | null;
};

export function parseVariantInputs(raw: FormDataEntryValue | null): VariantInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw ?? "[]"));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((v): VariantInput => ({
      id: typeof v?.id === "string" && v.id ? v.id : undefined,
      labelFr: String(v?.labelFr ?? "").trim(),
      labelEn: String(v?.labelEn ?? "").trim(),
      sku: String(v?.sku ?? "").trim(),
      priceCAD: Number(v?.priceCAD),
      stockQty: Math.max(0, Math.trunc(Number(v?.stockQty) || 0)),
      cloverItemId: String(v?.cloverItemId ?? "").trim() || null,
    }))
    .filter((v) => v.labelFr || v.labelEn || v.sku);
}
