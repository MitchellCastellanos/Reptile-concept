export const MAX_TRACK_BODY_BYTES = 1024;
export const MAX_TRACK_PATH_LENGTH = 200;

// URL path characters only: letters, digits and the RFC 3986 path punctuation
// that Next.js routes produce. No query string, fragment, spaces or control
// characters, so a path can never smuggle in free text.
const PATH_RE = /^\/[A-Za-z0-9\-._~!$&'()*+,;=:@%/]*$/;

export type TrackEvent = { path: string; locale: "fr" | "en" };

/** Strict validation + normalization; returns null for anything unacceptable. */
export function parseTrackEvent(input: unknown): TrackEvent | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  const { path, locale } = input as Record<string, unknown>;
  if (locale !== "fr" && locale !== "en") return null;
  if (typeof path !== "string" || path.length === 0 || path.length > MAX_TRACK_PATH_LENGTH) {
    return null;
  }
  if (!PATH_RE.test(path) || path.includes("//") || path.includes("..")) return null;
  // Normalize: "/products/" and "/products" are the same page.
  const normalized = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return { path: normalized || "/", locale };
}

/**
 * Cross-site abuse guard. Browsers always send Origin (and Sec-Fetch-Site) on
 * same-origin POSTs; a mismatch means another website is driving the beacon.
 * Requests with neither header (curl, scripts) cannot be told apart from
 * legitimate old browsers, so they are accepted — this is not a rate limiter.
 */
export function isAllowedOrigin(headers: Pick<Headers, "get">): boolean {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;
  const origin = headers.get("origin");
  if (!origin) return true;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}
