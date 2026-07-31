// Keeps the site's inventory/finance data in sync with sales rung up
// directly on the standalone Clover device (store counter or an expo
// booth), which is now how every in-person sale actually happens — the
// site finds out about them after the fact instead of deciding them.
//
// Two callers feed into the same processOrder() function:
// - The webhook route (src/app/api/clover/webhook/route.ts), for
//   near-real-time updates.
// - The polling cron (src/app/api/cron/clover-sync/route.ts), as a safety
//   net in case a webhook delivery is lost — Clover doesn't guarantee
//   exactly-once delivery, and dropped inventory events are how a live
//   animal ends up sold twice.
import { prisma } from "@/lib/db";
import {
  fetchCloverOrder,
  fetchCloverItem,
  listModifiedCloverOrders,
  listModifiedCloverItems,
  fetchAllCloverItems,
  setCloverItemStock,
  isCloverConfigured,
  type CloverOrder,
  type CloverItem,
} from "@/lib/clover";

function resolvePaymentMethod(order: CloverOrder): "cash" | "card" | undefined {
  const tenderLabel = order.payments?.elements?.[0]?.tender?.label?.toLowerCase();
  if (!tenderLabel) return undefined;
  return tenderLabel.includes("cash") || tenderLabel.includes("comptant") ? "cash" : "card";
}

// Only act on orders that actually collected a payment — an "open" order in
// Clover can just be a cart someone is still building at the register.
function isFinalized(order: CloverOrder): boolean {
  return (order.payments?.elements?.length ?? 0) > 0 || order.state === "locked";
}

export type ProcessOrderResult = { processed: boolean; reason?: string };

export async function processCloverOrder(order: CloverOrder): Promise<ProcessOrderResult> {
  if (!isFinalized(order)) return { processed: false, reason: "order not finalized yet" };

  const existing = await prisma.cloverSale.findUnique({ where: { cloverOrderId: order.id } });
  if (existing) return { processed: false, reason: "already synced" };

  const amountCAD = order.total / 100;
  const paymentMethod = resolvePaymentMethod(order);
  const lineItems = order.lineItems?.elements ?? [];

  const cloverItemIds = lineItems.map((li) => li.item?.id).filter((id): id is string => Boolean(id));
  const [animals, products] = await Promise.all([
    cloverItemIds.length
      ? prisma.animal.findMany({ where: { cloverItemId: { in: cloverItemIds } } })
      : Promise.resolve([]),
    cloverItemIds.length
      ? prisma.product.findMany({ where: { cloverItemId: { in: cloverItemIds } } })
      : Promise.resolve([]),
  ]);

  await prisma.$transaction(async (tx) => {
    const sale = await tx.cloverSale.create({
      data: {
        cloverOrderId: order.id,
        cloverPaymentId: order.payments?.elements?.[0]?.id,
        amountCAD,
        paymentMethod,
        cloverCreatedAt: order.createdTime ? new Date(order.createdTime) : undefined,
      },
    });

    for (const lineItem of lineItems) {
      const quantity = lineItem.unitQty ?? 1;
      // Clover reports the line's total price, not a per-unit price.
      const priceAtSaleCAD = lineItem.price / 100;
      const cloverItemId = lineItem.item?.id;
      const animal = cloverItemId ? animals.find((a) => a.cloverItemId === cloverItemId) : undefined;
      const product = cloverItemId ? products.find((p) => p.cloverItemId === cloverItemId) : undefined;

      await tx.cloverSaleItem.create({
        data: {
          cloverSaleId: sale.id,
          animalId: animal?.id,
          productId: product?.id,
          quantity,
          priceAtSaleCAD,
        },
      });

      // Only affect the site's own inventory for items that were actually
      // linked (via the "Clover Item ID" field on the animal/product admin
      // form) — an unlinked item still gets recorded here for the finance
      // mirror, but there's nothing on the site to mark unavailable.
      if (animal) {
        await tx.animal.updateMany({
          where: { id: animal.id, status: "available" },
          data: { status: "sold" },
        });
      } else if (product) {
        const nextStockQty = Math.max(0, product.stockQty - quantity);
        await tx.product.update({ where: { id: product.id }, data: { stockQty: nextStockQty } });
      }
    }

    await tx.financialRecord.create({
      data: {
        cloverSaleId: sale.id,
        type: "sale",
        channel: "clover_pos",
        paymentMethod,
        amountCAD,
        note: "Vente Clover (magasin ou expo)",
      },
    });
  });

  return { processed: true };
}

export async function syncCloverOrderById(orderId: string): Promise<ProcessOrderResult> {
  const order = await fetchCloverOrder(orderId);
  return processCloverOrder(order);
}

// Only auto-flip an animal between available <-> sold based on Clover's
// stock count — never touch reserved/on_hold/not_for_sale, those are staff
// decisions that have nothing to do with Clover's stock count.
async function syncLinkedAnimalFromItem(animalId: string, item: CloverItem) {
  const priceCAD = item.price / 100;
  await prisma.animal.update({ where: { id: animalId }, data: { priceCAD } });

  if (item.stockCount == null) return;
  if (item.stockCount <= 0) {
    await prisma.animal.updateMany({ where: { id: animalId, status: "available" }, data: { status: "sold" } });
  } else {
    await prisma.animal.updateMany({ where: { id: animalId, status: "sold" }, data: { status: "available" } });
  }
}

async function syncLinkedProductFromItem(productId: string, item: CloverItem) {
  await prisma.product.update({
    where: { id: productId },
    data: {
      priceCAD: item.price / 100,
      ...(item.stockCount != null ? { stockQty: Math.max(0, item.stockCount) } : {}),
    },
  });
}

export type ProcessItemResult = { action: "linked-animal" | "linked-product" | "queued" | "skipped" };

// Handles a Clover inventory item change (created directly on the device, or
// price/stock edited there). If it's already linked to a site record, Clover
// is treated as authoritative for price/stock from here on. Otherwise it's
// queued in CloverImportCandidate so staff can turn it into a real listing
// from the admin (see /admin/clover-import) without hunting for the item id.
export async function processCloverItem(item: CloverItem): Promise<ProcessItemResult> {
  const [animal, product] = await Promise.all([
    prisma.animal.findUnique({ where: { cloverItemId: item.id } }),
    prisma.product.findUnique({ where: { cloverItemId: item.id } }),
  ]);

  if (animal) {
    await syncLinkedAnimalFromItem(animal.id, item);
    return { action: "linked-animal" };
  }
  if (product) {
    await syncLinkedProductFromItem(product.id, item);
    return { action: "linked-product" };
  }

  const existingCandidate = await prisma.cloverImportCandidate.findUnique({ where: { cloverItemId: item.id } });
  // Don't resurrect one staff already dismissed or already turned into a
  // listing — just keep its descriptive fields current in case they revisit it.
  if (existingCandidate && existingCandidate.status !== "pending") {
    await prisma.cloverImportCandidate.update({
      where: { cloverItemId: item.id },
      data: {
        name: item.name,
        priceCAD: item.price / 100,
        cloverCategoryName: item.categories?.elements?.[0]?.name,
        stockCount: item.stockCount,
      },
    });
    return { action: "skipped" };
  }

  await prisma.cloverImportCandidate.upsert({
    where: { cloverItemId: item.id },
    update: {
      name: item.name,
      priceCAD: item.price / 100,
      cloverCategoryName: item.categories?.elements?.[0]?.name,
      stockCount: item.stockCount,
    },
    create: {
      cloverItemId: item.id,
      name: item.name,
      priceCAD: item.price / 100,
      cloverCategoryName: item.categories?.elements?.[0]?.name,
      stockCount: item.stockCount,
    },
  });
  return { action: "queued" };
}

export async function syncCloverItemById(itemId: string): Promise<ProcessItemResult> {
  const item = await fetchCloverItem(itemId);
  return processCloverItem(item);
}

// Removes a pending queue entry once its Clover item is deleted — if it was
// already linked to a real Animal/Product, leave that alone; a disappearing
// Clover item doesn't automatically mean the site listing should too.
export async function removeCloverImportCandidate(cloverItemId: string): Promise<void> {
  await prisma.cloverImportCandidate.deleteMany({ where: { cloverItemId, status: "pending" } });
}

type ProductCategoryValue =
  | "terrarium"
  | "substrate"
  | "decor"
  | "food_live"
  | "food_frozen"
  | "food_packaged";

export type BulkIgnoreResult = { ignored: number };

// Dismisses every pending candidate under one Clover category in one shot —
// for a catalog with hundreds/thousands of queued items, reviewing each one
// individually isn't realistic; staff triage by Clover category instead.
export async function bulkIgnoreCandidatesByCategory(cloverCategoryName: string | null): Promise<BulkIgnoreResult> {
  const result = await prisma.cloverImportCandidate.updateMany({
    where: { status: "pending", cloverCategoryName },
    data: { status: "ignored" },
  });
  return { ignored: result.count };
}

export type BulkCreateResult = { created: number; skipped: number };

// Turns every pending candidate under one Clover category into a real
// Product in one shot, all filed under the same site ProductCategory.
// Meant for generic accessories (a Clover "Substrates" category becoming a
// batch of site products), not animals — those still need individual
// species/genetics/description entry and go through the normal "Créer un
// animal" link instead. Uses the Clover item id as the SKU (guaranteed
// unique) rather than inventing one.
export async function bulkCreateProductsFromCategory(
  cloverCategoryName: string | null,
  productCategory: ProductCategoryValue,
): Promise<BulkCreateResult> {
  const candidates = await prisma.cloverImportCandidate.findMany({
    where: { status: "pending", cloverCategoryName },
  });

  let created = 0;
  let skipped = 0;
  for (const candidate of candidates) {
    try {
      await prisma.product.create({
        data: {
          sku: candidate.cloverItemId,
          category: productCategory,
          nameFr: candidate.name,
          nameEn: candidate.name,
          priceCAD: candidate.priceCAD,
          stockQty: candidate.stockCount ?? 0,
          cloverItemId: candidate.cloverItemId,
        },
      });
      await prisma.cloverImportCandidate.update({ where: { id: candidate.id }, data: { status: "created" } });
      created++;
    } catch (err) {
      console.error(`[clover-sync] bulk create skipped candidate ${candidate.id}:`, err);
      skipped++;
    }
  }
  return { created, skipped };
}

export type FullImportResult = { totalItems: number; queued: number; alreadyLinked: number };

// One-time (repeatable) backfill for a merchant's pre-existing Clover
// catalog. The webhook/poll only ever see items created or edited *after*
// the integration went live — anything captured in Clover before that never
// surfaces in /admin/clover-import on its own. This pulls Clover's entire
// current item list and runs it through the same processCloverItem() logic,
// so already-linked items just get their price/stock refreshed and
// everything else lands in the queue.
export async function importFullCloverCatalog(): Promise<FullImportResult> {
  const items = await fetchAllCloverItems();
  let queued = 0;
  let alreadyLinked = 0;
  for (const item of items) {
    const result = await processCloverItem(item);
    if (result.action === "queued") queued++;
    if (result.action === "linked-animal" || result.action === "linked-product") alreadyLinked++;
  }
  return { totalItems: items.length, queued, alreadyLinked };
}

export type PollResult = {
  ordersChecked: number;
  ordersProcessed: number;
  itemsChecked: number;
  itemsQueued: number;
};

// Polling fallback — catches anything a missed/failed webhook delivery
// didn't relay, for both sales (processCloverOrder) and catalog changes
// (processCloverItem). Safe to call repeatedly/concurrently: both are
// no-ops on data already synced.
export async function pollClover(): Promise<PollResult> {
  const state = await prisma.cloverSyncState.findUnique({ where: { id: "singleton" } });
  const sinceMs = state?.lastPolledAt ? state.lastPolledAt.getTime() : Date.now() - 24 * 60 * 60 * 1000;

  const [orders, items] = await Promise.all([listModifiedCloverOrders(sinceMs), listModifiedCloverItems(sinceMs)]);

  let ordersProcessed = 0;
  for (const order of orders) {
    const result = await processCloverOrder(order);
    if (result.processed) ordersProcessed++;
  }

  let itemsQueued = 0;
  for (const item of items) {
    const result = await processCloverItem(item);
    if (result.action === "queued") itemsQueued++;
  }

  await prisma.cloverSyncState.upsert({
    where: { id: "singleton" },
    update: { lastPolledAt: new Date() },
    create: { id: "singleton", lastPolledAt: new Date() },
  });

  return {
    ordersChecked: orders.length,
    ordersProcessed,
    itemsChecked: items.length,
    itemsQueued,
  };
}

type SoldLine = { cloverItemId: string | null | undefined; nextStockQty: number };

// Best-effort push so the standalone Clover device stops offering something
// that just sold online. Never throws — a failed push here must not roll
// back or block the sale the customer already paid for; worst case is the
// device shows stale stock until the next webhook/poll reconciles it.
export async function pushSoldItemsToClover(lines: SoldLine[]): Promise<void> {
  if (!isCloverConfigured()) return;

  for (const line of lines) {
    if (!line.cloverItemId) continue;
    try {
      await setCloverItemStock(line.cloverItemId, line.nextStockQty);
    } catch (err) {
      console.error(`[clover-sync] failed to push stock for item ${line.cloverItemId}:`, err);
    }
  }
}
