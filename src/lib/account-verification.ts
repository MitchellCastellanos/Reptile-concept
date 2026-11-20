import { createHmac } from "crypto";
import { safeEqual } from "@/lib/request-auth";

// Email-ownership proof for account registration. The registration form never
// creates or modifies a Customer directly: it emails a signed, expiring link
// (no password inside). The password is chosen on the page the link opens, so a
// forged registration cannot plant an attacker-known password. Only completing
// that page creates the account, so nobody can claim an email address they do not
// control (including guest customers created at checkout).

const TTL_MS = 60 * 60 * 1000; // 1 hour

type Payload = { e: string; n: string; x: number };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET environment variable is not set");
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(`account-verify:${payload}`).digest("hex");
}

export function createVerificationToken(email: string, fullName: string) {
  const payload = Buffer.from(
    JSON.stringify({ e: email, n: fullName, x: Date.now() + TTL_MS } satisfies Payload),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readVerificationToken(token: string): { email: string; fullName: string } | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  if (!safeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Payload;
    if (typeof data.e !== "string" || typeof data.n !== "string") return null;
    if (typeof data.x !== "number" || data.x < Date.now()) return null;
    return { email: data.e, fullName: data.n };
  } catch {
    return null;
  }
}
