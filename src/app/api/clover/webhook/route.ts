import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncCloverOrderById } from "@/lib/clover-sync";

// Receives near-real-time notifications from Clover (Developer Dashboard →
// this app → Webhooks) whenever an order/payment/item changes for this
// merchant. The polling cron (/api/cron/clover-sync) is the safety net for
// anything this endpoint misses — Clover doesn't guarantee delivery.
//
// Secured with a shared-secret query param rather than payload signature
// verification: Clover's webhook signing scheme isn't consistent enough
// across accounts/versions to rely on without confirming it directly in the
// client's Developer Dashboard, whereas a secret baked into the registered
// URL (?secret=...) is simple and just as effective against randoms hitting
// this endpoint. Set CLOVER_WEBHOOK_SECRET and register the webhook URL as
// https://.../api/clover/webhook?secret=<that value>.
function isAuthorized(request: Request): boolean {
  const secret = process.env.CLOVER_WEBHOOK_SECRET;
  if (!secret) return true; // not configured yet — allow through during initial setup
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

type CloverWebhookPayload = {
  appId?: string;
  verificationCode?: string;
  merchants?: Record<string, { objectId: string; type: string; ts: number }[]>;
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: CloverWebhookPayload = await request.json().catch(() => ({}));

  // First-time setup handshake: Clover posts a verificationCode when the
  // webhook URL is saved in the Developer Dashboard. Store it so whoever is
  // configuring it can read it back from the admin instead of digging
  // through deploy logs.
  if (payload.verificationCode) {
    await prisma.cloverSyncState.upsert({
      where: { id: "singleton" },
      update: { lastVerificationCode: payload.verificationCode },
      create: { id: "singleton", lastVerificationCode: payload.verificationCode },
    });
    return NextResponse.json({ ok: true });
  }

  const events = Object.values(payload.merchants ?? {}).flat();

  for (const event of events) {
    const eventId = `${event.objectId}:${event.ts}`;
    const alreadyProcessed = await prisma.cloverWebhookEvent.findUnique({ where: { id: eventId } });
    if (alreadyProcessed) continue;

    // objectId format is "<TYPE>:<id>", e.g. "O:ABC123" for an order,
    // "I:ABC123" for an inventory item, "PAYMENT:ABC123" for a payment.
    // Orders are the one we act on directly — a payment event without an
    // accompanying order change would be unusual, and inventory-item events
    // (price/name edits in Clover) don't need a push back from here.
    const [prefix, id] = event.objectId.split(":");
    try {
      if (prefix === "O" && id) {
        await syncCloverOrderById(id);
      }
    } catch (err) {
      console.error(`[clover:webhook] failed to process event ${event.objectId}:`, err);
      // Don't record it as processed — let the next delivery attempt or the
      // polling cron pick it up.
      continue;
    }

    await prisma.cloverWebhookEvent.create({
      data: { id: eventId, objectId: event.objectId, type: event.type },
    });
  }

  return NextResponse.json({ ok: true });
}

// Some webhook setups probe with a GET before saving the URL.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
