const GATE_COOKIE = "site_gate_access";
const GATE_PAYLOAD = "reptile-concept-staff";

function getGateSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-gate-secret";
}

export function getStaffGatePassword(): string {
  return process.env.STAFF_GATE_PASSWORD ?? "changeme123";
}

export function isSiteGateEnabled(): boolean {
  return process.env.SITE_GATE_ENABLED !== "false";
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createGateToken(): Promise<string> {
  return hmacHex(getGateSecret(), GATE_PAYLOAD);
}

export async function isValidGateToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await createGateToken();
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export { GATE_COOKIE };

export function gateCookieOptions(maxAgeSec = 60 * 60 * 24 * 30) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}
