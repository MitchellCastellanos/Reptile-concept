import { NextResponse } from "next/server";
import { expireOverduePickups } from "@/lib/order-expiration";

// Wire this up to a scheduled trigger (e.g. Vercel Cron) once deployed, so
// overdue pickups get cancelled/refunded even when nobody opens the admin
// panel. Protect it with CRON_SECRET if the route is publicly reachable.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const expiredCount = await expireOverduePickups();
  return NextResponse.json({ expiredCount });
}
