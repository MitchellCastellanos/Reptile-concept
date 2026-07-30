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
  listModifiedCloverOrders,
  setCloverItemStock,
  isCloverConfigured,
  type CloverOrder,
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

// Polling fallback — catches anything a missed/failed webhook delivery
// didn't relay. Safe to call repeatedly: processCloverOrder() is a no-op for
// an order already mirrored (unique cloverOrderId).
export async function pollCloverOrders(): Promise<{ checked: number; processed: number }> {
  const state = await prisma.cloverSyncState.findUnique({ where: { id: "singleton" } });
  const sinceMs = state?.lastPolledAt ? state.lastPolledAt.getTime() : Date.now() - 24 * 60 * 60 * 1000;

  const orders = await listModifiedCloverOrders(sinceMs);
  let processed = 0;
  for (const order of orders) {
    const result = await processCloverOrder(order);
    if (result.processed) processed++;
  }

  await prisma.cloverSyncState.upsert({
    where: { id: "singleton" },
    update: { lastPolledAt: new Date() },
    create: { id: "singleton", lastPolledAt: new Date() },
  });

  return { checked: orders.length, processed };
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
