import { NextResponse } from "next/server";
import { expireStalePendingPaymentOrders } from "@/lib/pending-order-expiration";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const expiredCount = await expireStalePendingPaymentOrders();
  return NextResponse.json({ expiredCount });
}
