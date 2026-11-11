import { addBusinessDays } from "@/lib/business-days";

// Perishable live feeders (crickets etc.) must be collected quickly: strict
// 48 hours from the "ready for pickup" notice. Everything else uses the
// admin-configured business-day window (StoreSettings.pickupDeadlineBusinessDays,
// 5 by default; the shop is open Mon–Sat).
export const LIVE_FOOD_PICKUP_HOURS = 48;

export function computePickupDeadline(
  readyAt: Date,
  standardBusinessDays: number,
  hasLiveFood: boolean,
): Date {
  if (hasLiveFood) {
    return new Date(readyAt.getTime() + LIVE_FOOD_PICKUP_HOURS * 60 * 60 * 1000);
  }
  return addBusinessDays(readyAt, standardBusinessDays);
}
