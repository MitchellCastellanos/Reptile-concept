import { prisma } from "@/lib/db";

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
}) {
  return prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
}
