import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { backInStockEmail } from "@/lib/email-templates";
import { getStoreContactInfo } from "@/lib/store-info";
import { getSiteUrl } from "@/lib/site-url";

export async function subscribeToStockNotification(email: string, productId: string) {
  await prisma.stockNotification.upsert({
    where: { email_productId: { email, productId } },
    update: {},
    create: { email, productId },
  });
}

/** Emails every pending subscriber for a product that just went back in stock. */
export async function notifyStockSubscribers(productId: string) {
  const subscribers = await prisma.stockNotification.findMany({
    where: { productId, notifiedAt: null },
  });
  if (subscribers.length === 0) return;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  const storeInfo = await getStoreContactInfo();
  const productUrl = `${getSiteUrl()}/boutique/${product.id}`;

  await Promise.all(
    subscribers.map(async (subscriber) => {
      const { subject, html } = backInStockEmail(
        { nameFr: product.nameFr, nameEn: product.nameEn },
        productUrl,
        storeInfo,
      );
      try {
        await sendEmail({ to: subscriber.email, subject, html });
      } catch (err) {
        console.error(`[stock-notifications] failed to email ${subscriber.email}:`, err);
      }
    }),
  );

  await prisma.stockNotification.updateMany({
    where: { id: { in: subscribers.map((s) => s.id) } },
    data: { notifiedAt: new Date() },
  });
}
