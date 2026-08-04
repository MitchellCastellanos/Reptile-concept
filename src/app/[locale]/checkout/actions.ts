"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sendOrderConfirmationEmail, sendAdminNewSaleEmail } from "@/lib/order-notifications";
import { getStoreSettings } from "@/lib/settings";
import { computeTax } from "@/lib/tax";
import {
  buildStripeLineItems,
  createManualPaidOrder,
  createPendingPaymentOrder,
  pushCloverStockForOrder,
  validateCartLines,
} from "@/lib/order-payment";
import { createStripeCheckoutSession, isStripeConfigured } from "@/lib/stripe";

type CartLineInput = {
  type: "animal" | "product";
  id: string;
  quantity: number;
};

export async function placeOrderAction(formData: FormData) {
  const cartJson = String(formData.get("cartJson") ?? "[]");
  const cart: CartLineInput[] = JSON.parse(cartJson);

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const preferredLang = String(formData.get("preferredLang") ?? "fr") as "fr" | "en";
  const street = String(formData.get("street") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const addressId = String(formData.get("addressId") ?? "").trim() || undefined;
  const healthGuaranteeAccepted = formData.get("healthGuaranteeAccepted") === "on";

  if (!fullName || !email) {
    throw new Error("Champs requis manquants / Missing required fields");
  }
  if (!addressId && (!street || !city || !province || !postalCode)) {
    throw new Error("Champs requis manquants / Missing required fields");
  }
  if (!healthGuaranteeAccepted) {
    throw new Error(
      "Vous devez accepter la politique de garantie de santé / You must accept the health guarantee policy",
    );
  }

  const validated = await validateCartLines(cart);
  const settings = await getStoreSettings();
  const { gstAmountCAD, qstAmountCAD, totalCAD } = computeTax(validated.subtotalCAD, {
    gstRatePercent: Number(settings.gstRatePercent),
    qstRatePercent: Number(settings.qstRatePercent),
  });

  const orderInput = {
    fullName,
    email,
    phone,
    preferredLang,
    street,
    city,
    province,
    postalCode,
    addressId,
    validated,
    gstAmountCAD,
    qstAmountCAD,
    totalCAD,
  };

  if (!isStripeConfigured()) {
    const orderId = await createManualPaidOrder(orderInput);

    try {
      await Promise.all([sendOrderConfirmationEmail(orderId), sendAdminNewSaleEmail(orderId)]);
    } catch (err) {
      console.error("[checkout] failed to send order notification emails:", err);
    }

    await pushCloverStockForOrder(orderId);
    redirect(`/checkout/confirmation/${orderId}`);
  }

  const orderId = await createPendingPaymentOrder(orderInput);
  const session = await createStripeCheckoutSession({
    orderId,
    locale: preferredLang,
    customerEmail: email,
    lineItems: buildStripeLineItems(validated, preferredLang),
    gstAmountCAD,
    qstAmountCAD,
  });

  await prisma.payment.updateMany({
    where: { orderId, status: "pending" },
    data: { providerRef: session.id },
  });

  if (!session.url) {
    throw new Error("Stripe checkout session did not return a redirect URL");
  }

  redirect(session.url);
}
