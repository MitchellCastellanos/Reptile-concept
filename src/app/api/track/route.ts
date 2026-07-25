import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { path, locale } = await request.json();
    if (typeof path !== "string" || (locale !== "fr" && locale !== "en")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await prisma.pageView.create({ data: { path: path.slice(0, 255), locale } });
  } catch {
    // Never let analytics failures affect the visitor's experience.
  }
  return NextResponse.json({ ok: true });
}
