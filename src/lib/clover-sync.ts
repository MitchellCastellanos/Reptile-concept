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
import { notifyStockSubscribers } from "@/lib/stock-notifications";
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
import type { ProductCategoryValue } from "@/lib/product-categories";
import {
  isMixedLiveAnimalCloverCategory,
  looksLikeAnimalCategory,
  resolveCloverImportRoute,
} from "@/lib/clover-category-mapping";
import { createAnimalFromCloverData } from "@/lib/clover-animal-import";
import { getStoreSettings } from "@/lib/settings";
import { estimateTaxFromTaxInclusiveTotal } from "@/lib/tax";

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

  // Clover doesn't report its own GST/QST split back through the sync, so
  // we back it out from the same rates the site's own checkout uses — the
  // in-person sale was subject to the same TPS/TVQ as everything else.
  const settings = await getStoreSettings();
  const { gstAmountCAD, qstAmountCAD } = estimateTaxFromTaxInclusiveTotal(amountCAD, {
    gstRatePercent: Number(settings.gstRatePercent),
    qstRatePercent: Number(settings.qstRatePercent),
  });

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
        gstAmountCAD,
        qstAmountCAD,
        note: "Vente Clover (magasin ou expo) — TPS/TVQ estimées à partir du total, Clover ne renvoie pas le détail",
      },
    });
  });

  return { processed: true };
}

export async function syncCloverOrderById(orderId: string): Promise<ProcessOrderResult> {
  const order = await fetchCloverOrder(orderId);
  return processCloverOrder(order);
}

// Only price syncs from the catalog here — animal status is never derived
// from Clover's stock count. This merchant's animal items are set to
// "Manually manage availability" in Clover, where the stock count field and
// the Available toggle are edited independently by staff (a live animal
// routinely sits at stockCount=0 while still genuinely for sale), so the
// count can't be trusted as an availability signal. The only thing that
// should ever flip an animal available -> sold is an actual sale
// (processCloverOrder above) — never touch reserved/on_hold/not_for_sale
// either way, those are staff decisions made on the site.
async function syncLinkedAnimalFromItem(animalId: string, item: CloverItem) {
  const priceCAD = item.price / 100;
  await prisma.animal.update({ where: { id: animalId }, data: { priceCAD } });
}

async function syncLinkedProductFromItem(productId: string, item: CloverItem) {
  const existing = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const nextStockQty =
    item.stockCount != null ? Math.max(0, item.stockCount) : existing.stockQty;
  const restocked = existing.stockQty <= 0 && nextStockQty > 0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      priceCAD: item.price / 100,
      ...(item.stockCount != null
        ? {
            stockQty: nextStockQty,
            ...(restocked ? { stockRestockedAt: new Date() } : {}),
            ...(nextStockQty <= 0 ? { stockRestockedAt: null } : {}),
          }
        : {}),
    },
  });

  if (restocked) {
    notifyStockSubscribers(productId).catch((err) =>
      console.error("[clover-sync] failed to notify stock subscribers:", err),
    );
  }
}

export type ProcessItemResult = {
  action:
    | "linked-animal"
    | "linked-product"
    | "queued"
    | "skipped"
    | "rule-auto-created"
    | "rule-auto-created-animal"
    | "rule-ignored";
};

// Category name as stored in CloverCategoryRule — "" stands in for "no
// Clover category set", kept non-null so the table's unique constraint
// behaves the same across databases.
function ruleKeyFor(item: Pick<CloverItem, "categories">): string {
  return item.categories?.elements?.[0]?.name ?? "";
}

// Handles a Clover inventory item change (created directly on the device, or
// price/stock edited there). If it's already linked to a site record, Clover
// is treated as authoritative for price/stock from here on. Otherwise, a
// saved CloverCategoryRule (see /admin/clover-import) may auto-create it as
// a Product straight away; failing that it's queued in CloverImportCandidate
// so staff can turn it into a real listing without hunting for the item id.
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

  const cloverCategoryName = item.categories?.elements?.[0]?.name ?? null;
  const route = resolveCloverImportRoute(cloverCategoryName, item.name);

  if (route.kind === "auto_product") {
    const created = await createProductFromCloverData({
      cloverItemId: item.id,
      name: item.name,
      priceCAD: item.price / 100,
      stockCount: item.stockCount,
      productCategory: route.productCategory,
      published: route.published,
    });
    if (created) {
      await prisma.cloverImportCandidate.updateMany({
        where: { cloverItemId: item.id },
        data: { status: "created" },
      });
      return { action: "rule-auto-created" };
    }
  }

  if (route.kind === "animal") {
    const created = await createAnimalFromCloverData({
      cloverItemId: item.id,
      name: item.name,
      priceCAD: item.price / 100,
      cloverCategoryName,
    });
    if (created) {
      await prisma.cloverImportCandidate.updateMany({
        where: { cloverItemId: item.id },
        data: { status: "created" },
      });
      return { action: "rule-auto-created-animal" };
    }
  }

  const rule = await prisma.cloverCategoryRule.findUnique({ where: { cloverCategoryName: ruleKeyFor(item) } });
  if (rule?.action === "ignore") {
    return { action: "rule-ignored" };
  }
  if (rule?.action === "auto_product" && rule.productCategory) {
    const created = await createProductFromCloverData({
      cloverItemId: item.id,
      name: item.name,
      priceCAD: item.price / 100,
      stockCount: item.stockCount,
      productCategory: rule.productCategory as ProductCategoryValue,
    });
    if (created) return { action: "rule-auto-created" };
    // Fell through (e.g. a rare id/sku collision) — queue it below instead
    // of silently losing it.
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

// Shared by the one-time bulk creation and the ongoing per-item auto-rule
// path — always uses the Clover item id as SKU (guaranteed unique) rather
// than inventing one, and files the same French/English name from Clover
// until staff refine them from the normal product edit form.
export async function createProductFromCloverData(params: {
  cloverItemId: string;
  name: string;
  priceCAD: number;
  stockCount?: number | null;
  productCategory: ProductCategoryValue;
  published?: boolean;
}): Promise<boolean> {
  try {
    await prisma.product.create({
      data: {
        sku: params.cloverItemId,
        category: params.productCategory,
        nameFr: params.name,
        nameEn: params.name,
        priceCAD: params.priceCAD,
        stockQty: params.stockCount ?? 0,
        cloverItemId: params.cloverItemId,
        published: params.published ?? false,
      },
    });
    return true;
  } catch (err) {
    console.error(`[clover-sync] failed to create product for Clover item ${params.cloverItemId}:`, err);
    return false;
  }
}

export type BulkIgnoreResult = { ignored: number };

export async function bulkIgnoreCandidatesByCategory(cloverCategoryName: string | null): Promise<BulkIgnoreResult> {
  const result = await prisma.cloverImportCandidate.updateMany({
    where: { status: "pending", cloverCategoryName },
    data: { status: "ignored" },
  });
  return { ignored: result.count };
}

export type BulkCreateResult = { created: number; skipped: number };

export async function bulkCreateAnimalsFromCategory(
  cloverCategoryName: string | null,
): Promise<BulkCreateResult> {
  if (!looksLikeAnimalCategory(cloverCategoryName)) {
    throw new Error(`Not an animal Clover category: ${cloverCategoryName}`);
  }
  if (isMixedLiveAnimalCloverCategory(cloverCategoryName)) {
    throw new Error(
      `Mixed live-animal Clover category — create animals one by one from the queue: ${cloverCategoryName}`,
    );
  }

  const candidates = await prisma.cloverImportCandidate.findMany({
    where: { status: "pending", cloverCategoryName },
  });

  let created = 0;
  let skipped = 0;
  for (const candidate of candidates) {
    const ok = await createAnimalFromCloverData({
      cloverItemId: candidate.cloverItemId,
      name: candidate.name,
      priceCAD: Number(candidate.priceCAD),
      cloverCategoryName: candidate.cloverCategoryName,
    });
    if (ok) {
      await prisma.cloverImportCandidate.update({
        where: { id: candidate.id },
        data: { status: "created" },
      });
      created++;
    } else {
      skipped++;
    }
  }
  return { created, skipped };
}

export async function bulkCreateProductsFromCategory(
  cloverCategoryName: string | null,
  productCategory: ProductCategoryValue,
): Promise<BulkCreateResult> {
  if (looksLikeAnimalCategory(cloverCategoryName)) {
    throw new Error(`Refusing to bulk-create Products for a category that looks like animals: ${cloverCategoryName}`);
  }

  const candidates = await prisma.cloverImportCandidate.findMany({
    where: { status: "pending", cloverCategoryName },
  });

  let created = 0;
  let skipped = 0;
  for (const candidate of candidates) {
    const ok = await createProductFromCloverData({
      cloverItemId: candidate.cloverItemId,
      name: candidate.name,
      priceCAD: Number(candidate.priceCAD),
      stockCount: candidate.stockCount,
      productCategory,
    });
    if (ok) {
      await prisma.cloverImportCandidate.update({ where: { id: candidate.id }, data: { status: "created" } });
      created++;
    } else {
      skipped++;
    }
  }
  return { created, skipped };
}

export type CloverCategoryRuleInfo = {
  cloverCategoryName: string;
  action: "auto_product" | "ignore";
  productCategory: ProductCategoryValue | null;
};

export async function listCloverCategoryRules(): Promise<CloverCategoryRuleInfo[]> {
  const rules = await prisma.cloverCategoryRule.findMany({ orderBy: { cloverCategoryName: "asc" } });
  return rules.map((r) => ({
    cloverCategoryName: r.cloverCategoryName,
    action: r.action,
    productCategory: r.productCategory as ProductCategoryValue | null,
  }));
}

// Remembers a decision so future items under this Clover category stop
// needing a click at all: "auto_product" auto-creates them as a Product
// going forward, "ignore" keeps them out of the queue entirely. `null`
// category means "items with no Clover category set".
export async function saveCloverCategoryRule(
  cloverCategoryName: string | null,
  action: "auto_product" | "ignore",
  productCategory?: ProductCategoryValue,
): Promise<void> {
  if (action === "auto_product" && looksLikeAnimalCategory(cloverCategoryName)) {
    throw new Error(`Refusing to save an auto-create rule for a category that looks like animals: ${cloverCategoryName}`);
  }

  const key = cloverCategoryName ?? "";
  await prisma.cloverCategoryRule.upsert({
    where: { cloverCategoryName: key },
    update: { action, productCategory: action === "auto_product" ? productCategory : null },
    create: { cloverCategoryName: key, action, productCategory: action === "auto_product" ? productCategory : null },
  });
}

export async function deleteCloverCategoryRule(cloverCategoryName: string | null): Promise<void> {
  const key = cloverCategoryName ?? "";
  await prisma.cloverCategoryRule.deleteMany({ where: { cloverCategoryName: key } });
}

export type FullImportResult = {
  totalItems: number;
  queued: number;
  alreadyLinked: number;
  autoCreated: number;
  autoCreatedAnimals: number;
};

// One-time (repeatable) backfill for a merchant's pre-existing Clover
// catalog. The webhook/poll only ever see items created or edited *after*
// the integration went live — anything captured in Clover before that never
// surfaces in /admin/clover-import on its own. This pulls Clover's entire
// current item list and runs it through the same processCloverItem() logic,
// so already-linked items just get their price/stock refreshed, anything
// matching a saved CloverCategoryRule is created/ignored automatically, and
// everything else lands in the queue.
export async function importFullCloverCatalog(): Promise<FullImportResult> {
  const items = await fetchAllCloverItems();
  let queued = 0;
  let alreadyLinked = 0;
  let autoCreated = 0;
  let autoCreatedAnimals = 0;
  for (const item of items) {
    const result = await processCloverItem(item);
    if (result.action === "queued") queued++;
    if (result.action === "linked-animal" || result.action === "linked-product") alreadyLinked++;
    if (result.action === "rule-auto-created") autoCreated++;
    if (result.action === "rule-auto-created-animal") autoCreatedAnimals++;
  }
  return { totalItems: items.length, queued, alreadyLinked, autoCreated, autoCreatedAnimals };
}

export type PollResult = {
  ordersChecked: number;
  ordersProcessed: number;
  itemsChecked: number;
  itemsQueued: number;
  itemsAutoCreated: number;
  itemsAutoCreatedAnimals: number;
  productsStockRefreshed: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Clover keeps stock counts on a separate /item_stocks resource from the
// item record itself (see clover.ts), and a restock rung in directly on the
// Clover device doesn't reliably bump the parent item's own modifiedTime.
// listModifiedCloverItems() below is filtered on exactly that modifiedTime,
// so a plain restock is invisible to it — a linked Product's stockQty could
// go stale forever even though price/name edits (which do touch modifiedTime)
// keep syncing fine. Unconditionally re-pull stock for every already-linked
// Product on each poll so restocks always converge within one polling cycle,
// independent of whatever triggers Clover considers a "modification".
async function refreshLinkedProductStock(): Promise<number> {
  const linked = await prisma.product.findMany({
    where: { cloverItemId: { not: null } },
    select: { cloverItemId: true },
  });

  let refreshed = 0;
  for (let i = 0; i < linked.length; i++) {
    const cloverItemId = linked[i].cloverItemId;
    if (!cloverItemId) continue;
    if (i > 0 && i % 10 === 0) await sleep(350);
    try {
      await syncCloverItemById(cloverItemId);
      refreshed++;
    } catch (err) {
      console.error(`[clover-sync] failed to refresh stock for item ${cloverItemId}:`, err);
    }
  }
  return refreshed;
}

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
  let itemsAutoCreated = 0;
  let itemsAutoCreatedAnimals = 0;
  for (const item of items) {
    const result = await processCloverItem(item);
    if (result.action === "queued") itemsQueued++;
    if (result.action === "rule-auto-created") itemsAutoCreated++;
    if (result.action === "rule-auto-created-animal") itemsAutoCreatedAnimals++;
  }

  const productsStockRefreshed = await refreshLinkedProductStock();

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
    itemsAutoCreated,
    itemsAutoCreatedAnimals,
    productsStockRefreshed,
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
