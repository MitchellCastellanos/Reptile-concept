import { NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/request-auth";
import { expireStalePendingPaymentOrders } from "@/lib/pending-order-expiration";
import { expireOverduePickups } from "@/lib/order-expiration";

// Piggybacks the overdue-pickup expiration (normally served by
// /api/cron/expire-orders) onto this same run. Vercel's Hobby plan caps a
// project at 2 scheduled cron jobs, and clover-sync + this one already use
// both slots, so /api/cron/expire-orders has no schedule of its own — it's
// still reachable directly (e.g. to trigger by hand), but production relies
// on this combined run for both expirations. /admin/orders also runs
// expireOverduePickups() on every load as a secondary safety net.
export async function GET(request: Request) {
  const denied = checkCronAuth(request);
  if (denied) return denied;

  const [expiredPendingCount, expiredPickupCount] = await Promise.all([
    expireStalePendingPaymentOrders(),
    expireOverduePickups(),
  ]);
  return NextResponse.json({ expiredPendingCount, expiredPickupCount });
}
