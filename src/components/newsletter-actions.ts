"use server";

import { subscribeToNewsletter } from "@/lib/newsletter";

export async function subscribeToNewsletterAction(
  locale: "fr" | "en",
  _prevState: { success?: boolean; error?: string } | undefined,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "invalid" };
  }

  await subscribeToNewsletter(email, locale);
  return { success: true };
}
