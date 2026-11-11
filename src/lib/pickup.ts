import { addBusinessDays } from "@/lib/business-days";

// Crickets must be collected quickly: strict 48 hours from the "ready for
// pickup" notice. Matched by product name (FR "grillon" / EN "cricket") since
// the catalog has no dedicated cricket category. Everything else uses the
// admin-configured business-day window (StoreSettings.pickupDeadlineBusinessDays,
// 5 by default; the shop is open Mon–Sat).
export const LIVE_FOOD_PICKUP_HOURS = 48;

export const CRICKET_NAME_PATTERN = /grillon|cricket/i;

export function isCricketName(...names: (string | null | undefined)[]) {
  return names.some((n) => Boolean(n && CRICKET_NAME_PATTERN.test(n)));
}

// Prisma filter for order items whose product is a cricket.
export const cricketProductWhere = {
  OR: [
    { nameFr: { contains: "grillon", mode: "insensitive" as const } },
    { nameFr: { contains: "cricket", mode: "insensitive" as const } },
    { nameEn: { contains: "cricket", mode: "insensitive" as const } },
    { nameEn: { contains: "grillon", mode: "insensitive" as const } },
  ],
};

export function computePickupDeadline(
  readyAt: Date,
  standardBusinessDays: number,
  hasCrickets: boolean,
): Date {
  if (hasCrickets) {
    return new Date(readyAt.getTime() + LIVE_FOOD_PICKUP_HOURS * 60 * 60 * 1000);
  }
  return addBusinessDays(readyAt, standardBusinessDays);
}
