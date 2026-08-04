"use server";

import { subscribeToStockNotification } from "@/lib/stock-notifications";

export async function notifyMeAction(
  productId: string,
  _prevState: { success?: boolean; error?: string } | undefined,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "invalid" };
  }

  await subscribeToStockNotification(email, productId);
  return { success: true };
}
