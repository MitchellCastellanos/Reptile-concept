import { NextResponse } from "next/server";
import { pollClover } from "@/lib/clover-sync";

// Safety net for the Clover webhook (/api/clover/webhook) — Clover doesn't
// guarantee webhook delivery. A missed order event means the site keeps
// showing a live animal as available after it already sold in person; a
// missed item event means something captured on the Clover device never
// shows up in the /admin/clover-import queue. Wire this up to a scheduled
// trigger (e.g. Vercel Cron, every few minutes) once deployed — see
// vercel.json. Protect it with CRON_SECRET if the route is publicly
// reachable.
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
