import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  orderConfirmationEmail,
  adminNewSaleEmail,
  orderPreparingEmail,
  orderReadyForPickupEmail,
  orderPickedUpEmail,
  orderExpiredEmail,
  type OrderEmailData,
} from "@/lib/email-templates";
import { getStoreSettings } from "@/lib/settings";
import { createReviewToken } from "@/lib/review-token";
import { getSiteUrl } from "@/lib/site-url";

async function loadOrder(orderId: string) {
  return prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      customer: true,
      items: { include: { animal: { include: { species: true } }, product: true } },
    },
  });
}

type OrderWithRelations = Awaited<ReturnType<typeof loadOrder>>;

function toEmailData(order: OrderWithRelations): OrderEmailData {
  return {
    orderId: order.id,
    customerName: order.customer.fullName,
    items: order.items.map((item) => ({
      name: item.animal
        ? `${item.animal.species.commonNameFr} — ${item.animal.morph}`
        : (item.product?.nameFr ?? ""),
      quantity: item.quantity,
      priceCAD: Number(item.priceAtSaleCAD),
    })),
    totalCAD: order.items.reduce(
      (sum, item) => sum + Number(item.priceAtSaleCAD) * item.quantity,
      0,
    ),
  };
}

async function resolveAdminEmail() {
  const settings = await getStoreSettings();
  if (settings.adminNotificationEmail) return settings.adminNotificationEmail;
  const owner = await prisma.adminUser.findFirst({
    where: { role: "owner" },
    orderBy: { createdAt: "asc" },
  });
  return owner?.email ?? null;
}

export async function sendOrderConfirmationEmail(orderId: string) {
  const order = await loadOrder(orderId);
  const { subject, html } = orderConfirmationEmail(order.customer.preferredLang, toEmailData(order));
  await sendEmail({ to: order.customer.email, subject, html });
}

export async function sendAdminNewSaleEmail(orderId: string) {
  const adminEmail = await resolveAdminEmail();
  if (!adminEmail) return;
  const order = await loadOrder(orderId);
  const url = `${getSiteUrl()}/admin/orders/${orderId}`;
  const { subject, html } = adminNewSaleEmail(toEmailData(order), url);
  await sendEmail({ to: adminEmail, subject, html });
}

export async function sendOrderPreparingEmail(orderId: string) {
  const order = await loadOrder(orderId);
  const { subject, html } = orderPreparingEmail(order.customer.preferredLang, toEmailData(order));
  await sendEmail({ to: order.customer.email, subject, html });
}

export async function sendOrderReadyForPickupEmail(
  orderId: string,
  deadline: Date,
  cancellationFeePercent: number,
) {
  const order = await loadOrder(orderId);
  const { subject, html } = orderReadyForPickupEmail(
    order.customer.preferredLang,
    toEmailData(order),
    deadline,
    cancellationFeePercent,
  );
  await sendEmail({ to: order.customer.email, subject, html });
}

export async function sendOrderPickedUpEmail(orderId: string) {
  const order = await loadOrder(orderId);
  const locale = order.customer.preferredLang;
  const token = createReviewToken(orderId);
  const reviewUrl = `${getSiteUrl()}/${locale}/reviews/new/${orderId}?token=${token}`;
  const { subject, html } = orderPickedUpEmail(locale, toEmailData(order), reviewUrl);
  await sendEmail({ to: order.customer.email, subject, html });
}

export async function sendOrderExpiredEmail(
  orderId: string,
  refundAmountCAD: number,
  feeAmountCAD: number,
) {
  const order = await loadOrder(orderId);
  const { subject, html } = orderExpiredEmail(
    order.customer.preferredLang,
    toEmailData(order),
    refundAmountCAD,
    feeAmountCAD,
  );
  await sendEmail({ to: order.customer.email, subject, html });
}
