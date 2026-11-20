import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/request-auth";
import {
  createGateToken,
  gateCookieOptions,
  getStaffGatePassword,
  GATE_COOKIE,
  isSiteGateEnabled,
} from "@/lib/site-gate";

export async function POST(request: Request) {
  if (!isSiteGateEnabled()) {
    return NextResponse.json({ ok: true });
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const expected = getStaffGatePassword();
  if (!expected || !safeEqual(password, expected)) {
    return NextResponse.json({ error: "Mot de passe incorrect / Incorrect password" }, { status: 401 });
  }

  const token = await createGateToken();
  const cookieStore = await cookies();
  cookieStore.set(GATE_COOKIE, token, gateCookieOptions());

  return NextResponse.json({ ok: true });
}
