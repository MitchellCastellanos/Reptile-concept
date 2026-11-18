import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  MAX_TRACK_BODY_BYTES,
  isAllowedOrigin,
  parseTrackEvent,
} from "@/lib/analytics/track-validation";

// Records one page view (path + locale + timestamp; no IP, no identifiers).
// Failures never affect the visitor: the client ignores the response.
export async function POST(request: Request) {
  if (!isAllowedOrigin(request.headers)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_TRACK_BODY_BYTES) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  let event;
  try {
    const text = await request.text();
    if (text.length > MAX_TRACK_BODY_BYTES) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }
    event = parseTrackEvent(JSON.parse(text));
  } catch {
    event = null;
  }
  if (!event) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await prisma.pageView.create({ data: event });
  } catch {
    // Never let analytics failures affect the visitor's experience.
  }
  return NextResponse.json({ ok: true });
}
