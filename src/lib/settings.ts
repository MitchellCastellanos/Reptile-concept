import { prisma } from "@/lib/db";
import type { WeeklyHours } from "@/lib/business-hours";

export async function getStoreSettings() {
  return prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export async function updateStoreSettings(data: {
  pickupDeadlineBusinessDays?: number;
  cancellationFeePercent?: number;
  adminNotificationEmail?: string | null;
  gstNumber?: string | null;
  qstNumber?: string | null;
  gstRatePercent?: number;
  qstRatePercent?: number;
  contactEmail?: string;
  contactPhone?: string;
  addressFr?: string;
  addressEn?: string;
  hoursFr?: string;
  hoursEn?: string;
  weeklyHours?: WeeklyHours;
}) {
  return prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
}
