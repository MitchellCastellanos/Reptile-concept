import { NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/request-auth";
import { expireOverduePickups } from "@/lib/order-expiration";

// Wire this up to a scheduled trigger (e.g. Vercel Cron) once deployed, so
// overdue pickups get cancelled/refunded even when nobody opens the admin
// panel. Protect it with CRON_SECRET if the route is publicly reachable.
export async function GET(request: Request) {
  const denied = checkCronAuth(request);
  if (denied) return denied;

  const expiredCount = await expireOverduePickups();
  return NextResponse.json({ expiredCount });
}
