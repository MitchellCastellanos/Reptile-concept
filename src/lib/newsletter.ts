import { prisma } from "@/lib/db";

export async function subscribeToNewsletter(email: string, locale: "fr" | "en") {
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { unsubscribedAt: null },
    create: { email, locale },
  });
}
