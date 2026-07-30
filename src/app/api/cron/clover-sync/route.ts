import { NextResponse } from "next/server";
import { pollClover } from "@/lib/clover-sync";

// Safety net for the Clover webhook (/api/clover/webhook) — Clover doesn't
// guarantee webhook delivery. A missed order event means the site keeps
// showing a live animal as available after it already sold in person; a
// missed item event means something captured on the Clover device never
// shows up in the /admin/clover-import queue.
//
// Scheduled once/day in vercel.json — Vercel's Hobby (free) plan rejects
// the entire deployment if a cron runs more than once a day, so do NOT
// tighten that schedule without confirming the project is on a paid plan
// first. Daily is only a backstop: the webhook is the real near-real-time
// path, and /admin/settings has a manual "Synchroniser maintenant" button
// for anyone who doesn't want to wait a day. Protect this route with
// CRON_SECRET if it's publicly reachable.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await pollClover();
  return NextResponse.json(result);
}
