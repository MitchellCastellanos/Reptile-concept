import { prisma } from "@/lib/db";
import { computeDiscount } from "@/lib/promo-math";

// Shown in the newsletter confirmation email; must match the seeded PromoCode row.
export const WELCOME_PROMO_CODE = "BIENVENUE15";

export type PromoError = "invalid" | "expired" | "alreadyUsed" | "emailRequired" | "notSubscribed";

export type PromoResult =
  | { ok: true; code: string; percentOff: number; discountCAD: number }
  | { ok: false; error: PromoError };

export function normalizePromoCode(raw: string) {
  return raw.trim().toUpperCase();
}

// A "first purchase" means no order of this email has been paid yet; abandoned
// or cancelled pending orders don't count against the customer.
export async function applyPromoCode(
  rawCode: string,
  email: string,
  subtotalCAD: number,
): Promise<PromoResult> {
  const code = normalizePromoCode(rawCode);
  const promo = code ? await prisma.promoCode.findUnique({ where: { code } }) : null;
  if (!promo || !promo.active) return { ok: false, error: "invalid" };
  if (promo.expiresAt && promo.expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: "expired" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if ((promo.subscribersOnly || promo.firstPurchaseOnly) && !normalizedEmail) {
    return { ok: false, error: "emailRequired" };
  }

  if (promo.subscribersOnly) {
    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: { email: normalizedEmail, unsubscribedAt: null },
      select: { id: true },
    });
    if (!subscriber) return { ok: false, error: "notSubscribed" };
  }

  if (promo.firstPurchaseOnly) {
    const previous = await prisma.order.count({
      where: {
        customer: { email: normalizedEmail },
        status: { in: ["paid", "preparing", "ready_for_pickup", "picked_up"] },
      },
    });
    if (previous > 0) return { ok: false, error: "alreadyUsed" };
  }

  return {
    ok: true,
    code: promo.code,
    percentOff: promo.percentOff,
    discountCAD: computeDiscount(subtotalCAD, promo.percentOff),
  };
}
