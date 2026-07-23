import { STORE_INFO, CONTACT_EMAIL } from "@/lib/store-info";

type Locale = "fr" | "en";

export type OrderEmailItem = {
  name: string;
  quantity: number;
  priceCAD: number;
};

export type OrderEmailData = {
  orderId: string;
  customerName: string;
  items: OrderEmailItem[];
  totalCAD: number;
};

function orderRef(orderId: string) {
  return `#${orderId.slice(0, 8)}`;
}

function itemsTable(items: OrderEmailItem[], locale: Locale) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;">${item.name}</td>
          <td style="padding:6px 0;text-align:center;">${item.quantity}</td>
          <td style="padding:6px 0;text-align:right;">${(item.priceCAD * item.quantity).toFixed(2)} $</td>
        </tr>`,
    )
    .join("");
  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="border-bottom:1px solid #e5e1db;text-align:left;">
          <th style="padding:6px 0;">${locale === "en" ? "Item" : "Article"}</th>
          <th style="padding:6px 0;text-align:center;">${locale === "en" ? "Qty" : "Qté"}</th>
          <th style="padding:6px 0;text-align:right;">${locale === "en" ? "Price" : "Prix"}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function shell(locale: Locale, title: string, bodyHtml: string) {
  const info = STORE_INFO[locale];
  return `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;padding:0;background:#faf8f5;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1f2937;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:20px;font-weight:700;color:#2d5a3d;">${info.name}</span>
      </div>
      <div style="background:#ffffff;border:1px solid #e5e1db;border-radius:16px;padding:24px;">
        <h1 style="font-size:20px;margin:0 0 16px;color:#2d5a3d;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="text-align:center;margin-top:24px;font-size:12px;color:#6b7280;">
        <p>${info.address} — ${info.hours}</p>
        <p>${info.phone} · ${CONTACT_EMAIL}</p>
      </div>
    </div>
  </body>
</html>`;
}

export function orderConfirmationEmail(locale: Locale, order: OrderEmailData) {
  const subject =
    locale === "en"
      ? `Order confirmed ${orderRef(order.orderId)} — ${STORE_INFO.en.name}`
      : `Commande confirmée ${orderRef(order.orderId)} — ${STORE_INFO.fr.name}`;

  const body =
    locale === "en"
      ? `<p>Hi ${order.customerName},</p>
         <p>Thanks for your purchase! We've received your payment for order ${orderRef(order.orderId)}.</p>
         ${itemsTable(order.items, locale)}
         <p style="font-weight:600;margin-top:12px;">Total: ${order.totalCAD.toFixed(2)} $ CAD</p>
         <p>Our team will start preparing your order shortly — you'll get an email as soon as it's ready for pickup.</p>`
      : `<p>Bonjour ${order.customerName},</p>
         <p>Merci pour votre achat! Nous avons bien reçu votre paiement pour la commande ${orderRef(order.orderId)}.</p>
         ${itemsTable(order.items, locale)}
         <p style="font-weight:600;margin-top:12px;">Total : ${order.totalCAD.toFixed(2)} $ CAD</p>
         <p>Notre équipe va commencer à préparer votre commande sous peu — vous recevrez un courriel dès qu'elle sera prête à être récupérée.</p>`;

  return { subject, html: shell(locale, subject, body) };
}

export function adminNewSaleEmail(order: OrderEmailData, adminOrderUrl: string) {
  const subject = `Nouvelle vente ${orderRef(order.orderId)} — ${order.totalCAD.toFixed(2)} $ CAD`;
  const body = `
    <p>Nouvelle commande payée de ${order.customerName}.</p>
    ${itemsTable(order.items, "fr")}
    <p style="font-weight:600;margin-top:12px;">Total : ${order.totalCAD.toFixed(2)} $ CAD</p>
    <p>Cliquez sur « Préparation » dans le panel admin pour commencer.</p>
    <p><a href="${adminOrderUrl}" style="color:#2d5a3d;font-weight:600;">Voir la commande</a></p>`;
  return { subject, html: shell("fr", subject, body) };
}

export function orderPreparingEmail(locale: Locale, order: OrderEmailData) {
  const subject =
    locale === "en"
      ? `Your order ${orderRef(order.orderId)} is being prepared`
      : `Votre commande ${orderRef(order.orderId)} est en préparation`;

  const body =
    locale === "en"
      ? `<p>Hi ${order.customerName},</p>
         <p>Good news — we've started preparing your order ${orderRef(order.orderId)}. Keep an eye on your inbox: we'll let you know as soon as it's ready for pickup.</p>`
      : `<p>Bonjour ${order.customerName},</p>
         <p>Bonne nouvelle — nous avons commencé à préparer votre commande ${orderRef(order.orderId)}. Restez à l'affût : nous vous avisons dès qu'elle sera prête à être récupérée.</p>`;

  return { subject, html: shell(locale, subject, body) };
}

export function orderReadyForPickupEmail(
  locale: Locale,
  order: OrderEmailData,
  deadline: Date,
  cancellationFeePercent: number,
) {
  const info = STORE_INFO[locale];
  const deadlineStr = deadline.toLocaleDateString(locale === "en" ? "en-CA" : "fr-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject =
    locale === "en"
      ? `Your order ${orderRef(order.orderId)} is ready for pickup!`
      : `Votre commande ${orderRef(order.orderId)} est prête à être récupérée!`;

  const body =
    locale === "en"
      ? `<p>Hi ${order.customerName},</p>
         <p>Your order ${orderRef(order.orderId)} is ready for pickup at our Lachine location.</p>
         <p><strong>Hours:</strong> ${info.hours}<br/><strong>Address:</strong> ${info.address}</p>
         ${itemsTable(order.items, locale)}
         <p style="margin-top:16px;padding:12px;background:#f3e8dc;border-radius:8px;">
           Please pick up your order by <strong>${deadlineStr}</strong>. After this date, the order will be
           automatically cancelled and refunded, minus a ${cancellationFeePercent}% cancellation fee.
         </p>`
      : `<p>Bonjour ${order.customerName},</p>
         <p>Votre commande ${orderRef(order.orderId)} est prête à être récupérée à notre boutique de Lachine.</p>
         <p><strong>Horaires :</strong> ${info.hours}<br/><strong>Adresse :</strong> ${info.address}</p>
         ${itemsTable(order.items, locale)}
         <p style="margin-top:16px;padding:12px;background:#f3e8dc;border-radius:8px;">
           Merci de récupérer votre commande avant le <strong>${deadlineStr}</strong>. Passé ce délai, la commande
           sera automatiquement annulée et remboursée, moins des frais d'annulation de ${cancellationFeePercent}%.
         </p>`;

  return { subject, html: shell(locale, subject, body) };
}

export function orderPickedUpEmail(locale: Locale, order: OrderEmailData, reviewUrl: string) {
  const subject =
    locale === "en"
      ? `Thanks for picking up order ${orderRef(order.orderId)}!`
      : `Merci d'être passé chercher la commande ${orderRef(order.orderId)}!`;

  const body =
    locale === "en"
      ? `<p>Hi ${order.customerName},</p>
         <p>We hope you enjoyed picking up your order and that everything is to your satisfaction!</p>
         <p>If you have a minute, we'd love to hear about your experience:</p>
         <p><a href="${reviewUrl}" style="display:inline-block;background:#2d5a3d;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-weight:600;">Leave a review</a></p>`
      : `<p>Bonjour ${order.customerName},</p>
         <p>Nous espérons que tout s'est bien passé et que vous êtes satisfait de votre commande!</p>
         <p>Si vous avez un instant, nous aimerions connaître votre expérience :</p>
         <p><a href="${reviewUrl}" style="display:inline-block;background:#2d5a3d;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-weight:600;">Laisser un avis</a></p>`;

  return { subject, html: shell(locale, subject, body) };
}

export function orderExpiredEmail(
  locale: Locale,
  order: OrderEmailData,
  refundAmountCAD: number,
  feeAmountCAD: number,
) {
  const subject =
    locale === "en"
      ? `Order ${orderRef(order.orderId)} cancelled — pickup window expired`
      : `Commande ${orderRef(order.orderId)} annulée — délai de récupération expiré`;

  const body =
    locale === "en"
      ? `<p>Hi ${order.customerName},</p>
         <p>Your order ${orderRef(order.orderId)} wasn't picked up within the allowed window, so it has been cancelled.</p>
         <p>You'll be refunded <strong>${refundAmountCAD.toFixed(2)} $ CAD</strong> (a cancellation fee of
         ${feeAmountCAD.toFixed(2)} $ CAD was withheld). If you still want these items, feel free to place a new order.</p>`
      : `<p>Bonjour ${order.customerName},</p>
         <p>Votre commande ${orderRef(order.orderId)} n'a pas été récupérée dans le délai prévu et a donc été annulée.</p>
         <p>Vous serez remboursé de <strong>${refundAmountCAD.toFixed(2)} $ CAD</strong> (des frais d'annulation de
         ${feeAmountCAD.toFixed(2)} $ CAD ont été retenus). Si les articles vous intéressent toujours, n'hésitez pas à
         passer une nouvelle commande.</p>`;

  return { subject, html: shell(locale, subject, body) };
}
