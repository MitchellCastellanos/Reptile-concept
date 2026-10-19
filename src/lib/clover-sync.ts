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
  fetchCloverCatalogSnapshot,
  setCloverItemStock,
  CloverApiError,
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

// Payment results that mean no money was actually kept — a declined card or a
// voided payment still shows up under order.payments, and treating it as a
// completed sale would mark a live animal sold that is still in the store.
const NON_COMPLETED_PAYMENT_RESULTS = new Set(["FAIL", "VOIDED", "VOIDING", "INITIATED"]);

// Only act on orders that actually collected a payment — an "open" order in
// Clover can just be a cart someone is still building at the register.
function isFinalized(order: CloverOrder): boolean {
  const hasCompletedPayment = (order.payments?.elements ?? []).some(
    (p) => !p.result || !NON_COMPLETED_PAYMENT_RESULTS.has(p.result.toUpperCase()),
  );
  return hasCompletedPayment || order.state === "locked";
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
        // An on_hold animal is one staff were holding for a customer — if it
        // rang up at the register anyway, it is gone either way.
        await tx.animal.updateMany({
          where: { id: animal.id, status: { in: ["available", "on_hold"] } },
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

// Clover is the source of truth for price and quantity — whatever the cashier
// sets there is what the site must show. Animal *status* is the one thing
// never derived from Clover's stock count, though: this merchant's animal
// items are set to "Manually manage availability" in Clover, where the stock
// count field and the Available toggle are edited independently by staff (a
// live animal routinely sits at stockCount=0 while still genuinely for sale),
// so the count can't be trusted as an availability signal. The only thing
// that flips an animal available -> sold is an actual sale
// (processCloverOrder above) — never touch reserved/on_hold/not_for_sale
// either way, those are staff decisions made on the site.

// A VARIABLE-priced item's Clover price is just a placeholder (the cashier
// types the amount at the register), so it must never overwrite the site's.
function cloverPriceCents(item: CloverItem): number | null {
  if (item.priceType === "VARIABLE") return null;
  return item.price;
}

function priceDiffers(sitePriceCAD: unknown, cloverCents: number | null): cloverCents is number {
  return cloverCents != null && Math.round(Number(sitePriceCAD) * 100) !== cloverCents;
}

type LinkedAnimal = { id: string; priceCAD: unknown };
type LinkedProduct = { id: string; priceCAD: unknown; stockQty: number };

type LinkedChange = { priceChanged: boolean; stockChanged: boolean };

// Writes only what actually differs, so a full-catalog reconcile over
// hundreds of linked records stays a handful of queries.
async function syncLinkedAnimalFromItem(animal: LinkedAnimal, item: CloverItem): Promise<LinkedChange> {
  const cents = cloverPriceCents(item);
  if (!priceDiffers(animal.priceCAD, cents)) return { priceChanged: false, stockChanged: false };
  await prisma.animal.update({ where: { id: animal.id }, data: { priceCAD: cents / 100 } });
  return { priceChanged: true, stockChanged: false };
}

async function syncLinkedProductFromItem(product: LinkedProduct, item: CloverItem): Promise<LinkedChange> {
  const cents = cloverPriceCents(item);
  const priceChanged = priceDiffers(product.priceCAD, cents);
  const nextStockQty = item.stockCount != null ? Math.max(0, item.stockCount) : product.stockQty;
  const stockChanged = nextStockQty !== product.stockQty;
  if (!priceChanged && !stockChanged) return { priceChanged, stockChanged };

  const restocked = product.stockQty <= 0 && nextStockQty > 0;
  await prisma.product.update({
    where: { id: product.id },
    data: {
      ...(priceChanged ? { priceCAD: cents / 100 } : {}),
      ...(stockChanged
        ? {
            stockQty: nextStockQty,
            ...(restocked ? { stockRestockedAt: new Date() } : {}),
            ...(nextStockQty <= 0 ? { stockRestockedAt: null } : {}),
          }
        : {}),
    },
  });

  if (restocked) {
    notifyStockSubscribers(product.id).catch((err) =>
      console.error("[clover-sync] failed to notify stock subscribers:", err),
    );
  }
  return { priceChanged, stockChanged };
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
    await syncLinkedAnimalFromItem(animal, item);
    return { action: "linked-animal" };
  }
  if (product) {
    await syncLinkedProductFromItem(product, item);
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

// A Clover item that no longer exists can't be sold at the register, so the
// site must stop offering the linked listing too — otherwise a customer can
// still buy online something the store removed from its inventory. This takes
// it offline (reversible from the admin: re-publish the product / set the
// animal back to available) instead of deleting the row, since orders and
// finance records may reference it. Reserved/sold animals are left alone.
export async function handleCloverItemRemoved(cloverItemId: string): Promise<void> {
  await prisma.cloverImportCandidate.deleteMany({ where: { cloverItemId, status: "pending" } });
  await prisma.product.updateMany({ where: { cloverItemId, published: true }, data: { published: false } });
  await prisma.animal.updateMany({
    where: { cloverItemId, status: { in: ["available", "on_hold"] } },
    data: { status: "not_for_sale" },
  });
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
  pricesUpdated: number;
  stockUpdated: number;
  removed: number;
  missing: number;
};

export type ReconcileResult = {
  linkedChecked: number;
  pricesUpdated: number;
  stockUpdated: number;
  removed: number;
  // Live linked records whose Clover item wasn't in the catalog: `removed`
  // of them were confirmed deleted and taken offline, the rest are waiting
  // for the next run (per-run check cap) or were held back by the safety
  // guard — surfaced so a silent "0" can't hide them.
  missing: number;
  linkedItemIds: Set<string>;
};

// How large a share of linked records may be missing from Clover's catalog
// before the reconcile concludes the listing itself is wrong (a truncated
// page, an API hiccup, the wrong merchant token) rather than that staff
// really deleted that many items — in which case it takes nothing offline.
const MAX_MISSING_LINKED_FRACTION = 0.25;
// Each missing item is confirmed with its own Clover request, so only this
// many are checked per run; a bigger backlog drains over the next runs.
const MAX_MISSING_LINKED_CHECKS = 40;

// The single place that makes every already-linked animal/product match
// Clover, regardless of which events were or weren't delivered. Neither the
// webhook (Clover doesn't guarantee delivery, and a stock-only edit may not
// emit an item event at all) nor modifiedTime-based polling (stock lives on a
// separate /item_stocks resource that doesn't reliably bump the item's
// modifiedTime, and the window silently dropped anything past the first page)
// is a safe sole trigger, so this compares the whole current Clover catalog
// against the site instead:
// - price for linked animals and products,
// - stock for linked products,
// - linked records whose Clover item was deleted are taken offline.
// Two bulk reads of Clover plus two of our DB, and only differing rows are
// written, so it scales with catalog size/100 rather than record count.
export async function reconcileLinkedInventory(
  snapshot?: Awaited<ReturnType<typeof fetchCloverCatalogSnapshot>>,
): Promise<ReconcileResult> {
  const [animals, products] = await Promise.all([
    prisma.animal.findMany({
      where: { cloverItemId: { not: null } },
      select: { id: true, cloverItemId: true, priceCAD: true, status: true },
    }),
    prisma.product.findMany({
      where: { cloverItemId: { not: null } },
      select: { id: true, cloverItemId: true, priceCAD: true, stockQty: true, published: true },
    }),
  ]);
  const linkedItemIds = new Set<string>();
  for (const a of animals) if (a.cloverItemId) linkedItemIds.add(a.cloverItemId);
  for (const p of products) if (p.cloverItemId) linkedItemIds.add(p.cloverItemId);
  if (linkedItemIds.size === 0) {
    return { linkedChecked: 0, pricesUpdated: 0, stockUpdated: 0, removed: 0, missing: 0, linkedItemIds };
  }

  const { items, complete } = snapshot ?? (await fetchCloverCatalogSnapshot());
  const itemById = new Map(items.map((item) => [item.id, item]));

  let pricesUpdated = 0;
  let stockUpdated = 0;
  const missing = new Set<string>();

  for (const animal of animals) {
    if (!animal.cloverItemId) continue;
    const item = itemById.get(animal.cloverItemId);
    if (!item) {
      // Only listings still live matter — one already taken offline (or sold)
      // stays as staff left it instead of being re-checked every run.
      if (animal.status === "available" || animal.status === "on_hold") missing.add(animal.cloverItemId);
      continue;
    }
    try {
      const change = await syncLinkedAnimalFromItem(animal, item);
      if (change.priceChanged) pricesUpdated++;
    } catch (err) {
      console.error(`[clover-sync] failed to sync animal for item ${animal.cloverItemId}:`, err);
    }
  }

  for (const product of products) {
    if (!product.cloverItemId) continue;
    const item = itemById.get(product.cloverItemId);
    if (!item) {
      if (product.published) missing.add(product.cloverItemId);
      continue;
    }
    try {
      const change = await syncLinkedProductFromItem(product, item);
      if (change.priceChanged) pricesUpdated++;
      if (change.stockChanged) stockUpdated++;
    } catch (err) {
      console.error(`[clover-sync] failed to sync product for item ${product.cloverItemId}:`, err);
    }
  }

  let removed = 0;
  if (complete && items.length > 0 && missing.size > 0) {
    const plausible = missing.size / linkedItemIds.size <= MAX_MISSING_LINKED_FRACTION;
    if (!plausible) {
      console.error(
        `[clover-sync] ${missing.size}/${linkedItemIds.size} linked items missing from Clover's catalog — ` +
          "not taking anything offline; check the Clover credentials/listing.",
      );
    } else {
      for (const cloverItemId of [...missing].slice(0, MAX_MISSING_LINKED_CHECKS)) {
        // Confirm each with a direct lookup — only an explicit 404 counts as
        // deleted, never a timeout or a throttled request.
        try {
          await fetchCloverItem(cloverItemId);
        } catch (err) {
          if (err instanceof CloverApiError && err.status === 404) {
            await handleCloverItemRemoved(cloverItemId);
            removed++;
          } else {
            console.error(`[clover-sync] could not confirm removal of Clover item ${cloverItemId}:`, err);
          }
        }
      }
    }
  }

  return { linkedChecked: linkedItemIds.size, pricesUpdated, stockUpdated, removed, missing: missing.size, linkedItemIds };
}

// One-time (repeatable) backfill for a merchant's pre-existing Clover
// catalog. The webhook/poll only ever see items created or edited *after* the
// integration went live — anything captured in Clover before that never
// surfaces in /admin/clover-import on its own. This pulls Clover's entire
// current item list: already-linked records are reconciled in bulk (price,
// stock, removals), and every other item goes through processCloverItem() so
// anything matching a saved CloverCategoryRule is created/ignored
// automatically and everything else lands in the queue.
export async function importFullCloverCatalog(): Promise<FullImportResult> {
  const snapshot = await fetchCloverCatalogSnapshot();
  const reconcile = await reconcileLinkedInventory(snapshot);

  let queued = 0;
  let autoCreated = 0;
  let autoCreatedAnimals = 0;
  for (const item of snapshot.items) {
    if (reconcile.linkedItemIds.has(item.id)) continue;
    const result = await processCloverItem(item);
    if (result.action === "queued") queued++;
    if (result.action === "rule-auto-created") autoCreated++;
    if (result.action === "rule-auto-created-animal") autoCreatedAnimals++;
  }
  return {
    totalItems: snapshot.items.length,
    queued,
    alreadyLinked: reconcile.linkedChecked,
    autoCreated,
    autoCreatedAnimals,
    pricesUpdated: reconcile.pricesUpdated,
    stockUpdated: reconcile.stockUpdated,
    removed: reconcile.removed,
    missing: reconcile.missing,
  };
}

export type PollResult = {
  ordersChecked: number;
  ordersProcessed: number;
  itemsChecked: number;
  itemsQueued: number;
  itemsAutoCreated: number;
  itemsAutoCreatedAnimals: number;
  linkedPricesUpdated: number;
  productsStockRefreshed: number;
  linkedRemoved: number;
  linkedMissing: number;
};

// Polling fallback — catches anything a missed/failed webhook delivery
// didn't relay, for both sales (processCloverOrder) and catalog changes.
// Safe to call repeatedly/concurrently: everything it does is a no-op on data
// already in sync.
export async function pollClover(): Promise<PollResult> {
  const state = await prisma.cloverSyncState.findUnique({ where: { id: "singleton" } });
  const sinceMs = state?.lastPolledAt ? state.lastPolledAt.getTime() : Date.now() - 24 * 60 * 60 * 1000;
  // Taken before any fetching so an edit made while this run is in flight
  // falls inside the next run's window instead of between two of them.
  const startedAt = new Date();

  const [orders, items] = await Promise.all([listModifiedCloverOrders(sinceMs), listModifiedCloverItems(sinceMs)]);

  let ordersProcessed = 0;
  for (const order of orders) {
    const result = await processCloverOrder(order);
    if (result.processed) ordersProcessed++;
  }

  // New/edited items that aren't linked yet (auto-create rules, import queue).
  // Linked ones are handled by the full reconcile below.
  let itemsQueued = 0;
  let itemsAutoCreated = 0;
  let itemsAutoCreatedAnimals = 0;
  for (const item of items) {
    const result = await processCloverItem(item);
    if (result.action === "queued") itemsQueued++;
    if (result.action === "rule-auto-created") itemsAutoCreated++;
    if (result.action === "rule-auto-created-animal") itemsAutoCreatedAnimals++;
  }

  const reconcile = await reconcileLinkedInventory();

  await prisma.cloverSyncState.upsert({
    where: { id: "singleton" },
    update: { lastPolledAt: startedAt },
    create: { id: "singleton", lastPolledAt: startedAt },
  });

  return {
    ordersChecked: orders.length,
    ordersProcessed,
    itemsChecked: items.length,
    itemsQueued,
    itemsAutoCreated,
    itemsAutoCreatedAnimals,
    linkedPricesUpdated: reconcile.pricesUpdated,
    productsStockRefreshed: reconcile.stockUpdated,
    linkedRemoved: reconcile.removed,
    linkedMissing: reconcile.missing,
  };
}

export type FullSyncResult = FullImportResult & { ordersChecked: number; ordersProcessed: number };

// What the admin's single "Synchroniser avec Clover" button runs: everything
// the scheduled poll does (sales since the last poll, linked price/stock/
// removals) plus the pass over every not-yet-linked Clover item that feeds the
// import queue and category rules. One entry point, so there is no separate
// "refresh" vs "import" to choose between.
export async function syncCloverFully(): Promise<FullSyncResult> {
  const state = await prisma.cloverSyncState.findUnique({ where: { id: "singleton" } });
  const sinceMs = state?.lastPolledAt ? state.lastPolledAt.getTime() : Date.now() - 24 * 60 * 60 * 1000;
  const startedAt = new Date();

  const orders = await listModifiedCloverOrders(sinceMs);
  let ordersProcessed = 0;
  for (const order of orders) {
    if ((await processCloverOrder(order)).processed) ordersProcessed++;
  }

  const imported = await importFullCloverCatalog();

  await prisma.cloverSyncState.upsert({
    where: { id: "singleton" },
    update: { lastPolledAt: startedAt },
    create: { id: "singleton", lastPolledAt: startedAt },
  });
  return { ...imported, ordersChecked: orders.length, ordersProcessed };
}

// Brings the cart's own items (and any sale rung up at the register in the
// last few hours) up to date from Clover right before the customer is
// charged, so a daily/lagging sync can't let someone pay online for a live
// animal that already sold in the store or at a price staff just changed.
// Best-effort and time-boxed: Clover being slow or down must never block
// checkout — the normal validation just runs on whatever the site last knew.
export async function refreshCartFromClover(
  lines: { type: "animal" | "product"; id: string }[],
  timeoutMs = 8000,
): Promise<void> {
  if (!isCloverConfigured() || lines.length === 0) return;

  const run = async () => {
    const recentOrders = await listModifiedCloverOrders(Date.now() - 6 * 60 * 60 * 1000);
    for (const order of recentOrders) await processCloverOrder(order);

    const animalIds = lines.filter((l) => l.type === "animal").map((l) => l.id);
    const productIds = lines.filter((l) => l.type === "product").map((l) => l.id);
    const [animals, products] = await Promise.all([
      animalIds.length
        ? prisma.animal.findMany({ where: { id: { in: animalIds }, cloverItemId: { not: null } } })
        : Promise.resolve([]),
      productIds.length
        ? prisma.product.findMany({ where: { id: { in: productIds }, cloverItemId: { not: null } } })
        : Promise.resolve([]),
    ]);
    for (const animal of animals) {
      if (animal.cloverItemId) await syncLinkedAnimalFromItem(animal, await fetchCloverItem(animal.cloverItemId));
    }
    for (const product of products) {
      if (product.cloverItemId) await syncLinkedProductFromItem(product, await fetchCloverItem(product.cloverItemId));
    }
  };

  try {
    await Promise.race([
      run(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timed out")), timeoutMs)),
    ]);
  } catch (err) {
    console.error("[clover-sync] pre-checkout refresh failed (continuing with last known data):", err);
  }
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
