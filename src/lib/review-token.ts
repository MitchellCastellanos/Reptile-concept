import { createHmac, timingSafeEqual } from "crypto";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return secret;
}

export function createReviewToken(orderId: string) {
  return createHmac("sha256", getSecret()).update(`review:${orderId}`).digest("hex");
}

export function verifyReviewToken(orderId: string, token: string) {
  const expected = createReviewToken(orderId);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
