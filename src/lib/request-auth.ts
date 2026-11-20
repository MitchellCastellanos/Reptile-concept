import { createHash, timingSafeEqual } from "crypto";

/** Constant-time string comparison (hashes first so lengths never leak). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Secrets that guard machine-to-machine endpoints must fail CLOSED in
 * production: a missing env var must never leave the endpoint public.
 * Outside production an unset secret is allowed to ease local setup.
 */
export function secretRequired(secret: string | undefined): boolean {
  return Boolean(secret) || process.env.NODE_ENV === "production";
}

/** Returns a Response to send back when the cron bearer check fails, else null. */
export function checkCronAuth(request: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secretRequired(secret)) return null;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  const header = request.headers.get("authorization") ?? "";
  if (!safeEqual(header, `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
