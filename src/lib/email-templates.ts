import type { StoreContactInfo } from "@/lib/store-info";
import { getSiteUrl } from "@/lib/site-url";

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
  subtotalCAD: number;
  discountCAD?: number;
  promoCode?: string | null;
  gstAmountCAD: number;
  qstAmountCAD: number;
  totalCAD: number;
};

// ---------------------------------------------------------------------------
// Brand tokens — mirror the storefront palette in globals.css so emails look
// like the website. Inline styles only: email clients ignore <style>/CSS vars.
// ---------------------------------------------------------------------------
const BRAND = {
  primary: "#2d5a3d",
  primaryDark: "#23472f",
  accent: "#c17b4a",
  accentLight: "#f3e8dc",
  background: "#f3efe8",
  surface: "#faf8f5",
  card: "#ffffff",
  border: "#e5e1db",
  text: "#1f2937",
  muted: "#6b7280",
};
const FONT_SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const FONT_DISPLAY = "Georgia,'Times New Roman',serif";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function orderRef(orderId: string) {
  return `#${orderId.slice(0, 8)}`;
}

function money(amount: number) {
  return `${amount.toFixed(2)} $`;
}

// ---------------------------------------------------------------------------
// Reusable building blocks
// ---------------------------------------------------------------------------

/** Paragraph with consistent spacing/typography. */
function p(html: string, extraStyle = "") {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.text};${extraStyle}">${html}</p>`;
}

/** Small grey print. */
function small(html: string) {
  return p(html, `font-size:12px;color:${BRAND.muted};margin-top:20px;`);
}

/** Bulletproof (table-based) pill button — renders in Outlook too. */
function button(href: string, label: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto;">
      <tr>
        <td align="center" bgcolor="${BRAND.primary}" style="border-radius:999px;">
          <a href="${href}" style="display:inline-block;padding:13px 32px;font-family:${FONT_SANS};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a>
        </td>
      </tr>
    </table>`;
}

/** Highlighted box (warm tone by default). */
function callout(html: string, opts: { center?: boolean } = {}) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="background:${BRAND.accentLight};border-left:4px solid ${BRAND.accent};border-radius:10px;padding:16px 18px;font-size:14px;line-height:1.6;color:${BRAND.text};${opts.center ? "text-align:center;" : ""}">${html}</td>
      </tr>
    </table>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0;" />`;
}

function itemsTable(items: OrderEmailItem[], locale: Locale) {
  const th = `padding:10px 12px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};font-weight:600;`;
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px;border-top:1px solid ${BRAND.border};font-size:14px;">${escapeHtml(item.name)}</td>
          <td style="padding:12px;border-top:1px solid ${BRAND.border};font-size:14px;text-align:center;color:${BRAND.muted};">${item.quantity}</td>
          <td style="padding:12px;border-top:1px solid ${BRAND.border};font-size:14px;text-align:right;white-space:nowrap;">${money(item.priceCAD * item.quantity)}</td>
        </tr>`,
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.border};border-radius:12px;border-collapse:separate;border-spacing:0;overflow:hidden;margin:8px 0 4px;">
      <thead>
        <tr style="background:${BRAND.surface};">
          <th align="left" style="${th}">${locale === "en" ? "Item" : "Article"}</th>
          <th align="center" style="${th}">${locale === "en" ? "Qty" : "Qté"}</th>
          <th align="right" style="${th}">${locale === "en" ? "Price" : "Prix"}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/** Subtotal/tax lines plus a bold total row, right-aligned under the items. */
function totalsTable(lines: [string, number][], totalCAD: number) {
  const rows = lines
    .map(
      ([label, amount]) =>
        `<tr><td style="padding:3px 12px;font-size:13px;color:${BRAND.muted};">${label}</td><td style="padding:3px 12px;font-size:13px;color:${BRAND.muted};text-align:right;white-space:nowrap;">${amount < 0 ? "−" : ""}${money(Math.abs(amount))}</td></tr>`,
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;">
      <tbody>
        ${rows}
        <tr>
          <td style="padding:10px 12px 0;border-top:2px solid ${BRAND.primary};font-family:${FONT_DISPLAY};font-size:17px;font-weight:700;color:${BRAND.primary};">Total</td>
          <td style="padding:10px 12px 0;border-top:2px solid ${BRAND.primary};font-family:${FONT_DISPLAY};font-size:17px;font-weight:700;color:${BRAND.primary};text-align:right;white-space:nowrap;">${money(totalCAD)} CAD</td>
        </tr>
      </tbody>
    </table>`;
}

function taxSummary(order: OrderEmailData, locale: Locale) {
  if (order.gstAmountCAD <= 0 && order.qstAmountCAD <= 0) {
    return totalsTable([], order.totalCAD);
  }
  const lines: [string, number][] = [[locale === "en" ? "Subtotal" : "Sous-total", order.subtotalCAD]];
  if ((order.discountCAD ?? 0) > 0) {
    lines.push([
      `${locale === "en" ? "Promo" : "Rabais"}${order.promoCode ? ` (${escapeHtml(order.promoCode)})` : ""}`,
      -(order.discountCAD ?? 0),
    ]);
  }
  lines.push([locale === "en" ? "GST" : "TPS", order.gstAmountCAD], [locale === "en" ? "QST" : "TVQ", order.qstAmountCAD]);
  return totalsTable(lines, order.totalCAD);
}

// ---------------------------------------------------------------------------
// Shared shell: every email (customer or admin) goes through this.
// ---------------------------------------------------------------------------
type ShellOptions = {
  /** Hidden inbox-preview text shown next to the subject line. */
  preheader?: string;
  /** Marks internal notifications with an "Admin" pill above the title. */
  admin?: boolean;
  /** Footer extra line (e.g. unsubscribe). */
  footerNote?: string;
};

function shell(
  locale: Locale,
  title: string,
  bodyHtml: string,
  storeInfo: StoreContactInfo,
  opts: ShellOptions = {},
) {
  const info = storeInfo[locale];
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const logoUrl = `${siteUrl}/email-logo.png`;
  const tagline =
    opts.admin
      ? "Notification interne"
      : locale === "en"
        ? "Reptiles, amphibians & supplies — Lachine, QC"
        : "Reptiles, amphibiens et accessoires — Lachine, QC";
  const adminPill = opts.admin
    ? `<span style="display:inline-block;margin:0 0 12px;padding:4px 12px;border-radius:999px;background:${BRAND.accent};color:#ffffff;font-family:${FONT_SANS};font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Admin</span><br/>`
    : "";

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.background};font-family:${FONT_SANS};color:${BRAND.text};-webkit-text-size-adjust:100%;">
    ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(opts.preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.background};">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:18px;border-collapse:separate;overflow:hidden;">
            <!-- Brand bar -->
            <tr>
              <td style="height:6px;line-height:6px;font-size:0;background:${BRAND.primary};border-top-left-radius:18px;border-top-right-radius:18px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td width="85%" style="height:6px;line-height:6px;font-size:0;background:${BRAND.primary};">&nbsp;</td>
                  <td width="15%" style="height:6px;line-height:6px;font-size:0;background:${BRAND.accent};">&nbsp;</td>
                </tr></table>
              </td>
            </tr>
            <!-- Logo -->
            <tr>
              <td align="center" style="padding:28px 24px 8px;background:${BRAND.card};">
                <a href="${siteUrl}/${locale}" style="text-decoration:none;">
                  <img src="${logoUrl}" width="220" alt="${escapeHtml(info.name)}" style="display:block;border:0;outline:none;width:220px;max-width:100%;height:auto;font-family:${FONT_DISPLAY};font-size:20px;font-weight:700;color:${BRAND.primary};" />
                </a>
                <p style="margin:10px 0 0;font-size:12px;letter-spacing:.04em;color:${BRAND.muted};">${tagline}</p>
              </td>
            </tr>
            <!-- Title + body -->
            <tr>
              <td style="padding:20px 36px 32px;background:${BRAND.card};">
                <div style="border-top:1px solid ${BRAND.border};padding-top:24px;">
                  ${adminPill}
                  <h1 style="margin:0 0 18px;font-family:${FONT_DISPLAY};font-size:24px;line-height:1.3;font-weight:700;color:${BRAND.primary};">${escapeHtml(title)}</h1>
                  ${bodyHtml}
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="padding:24px 28px;background:${BRAND.primary};font-size:12px;line-height:1.7;color:#d9e6dd;">
                <p style="margin:0 0 6px;font-family:${FONT_DISPLAY};font-size:16px;font-weight:700;color:#ffffff;">${escapeHtml(info.name)}</p>
                <p style="margin:0;">📍 ${info.address}</p>
                <p style="margin:0;">🕒 ${info.hours}</p>
                <p style="margin:0;">📞 ${info.phone} &nbsp;·&nbsp; <a href="mailto:${storeInfo.contactEmail}" style="color:#ffffff;text-decoration:underline;">${storeInfo.contactEmail}</a></p>
                ${opts.footerNote ? `<p style="margin:12px 0 0;color:#b7cfbf;">${opts.footerNote}</p>` : ""}
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:11px;color:${BRAND.muted};">© ${new Date().getFullYear()} ${escapeHtml(info.name)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ---------------------------------------------------------------------------
// Customer emails
// ---------------------------------------------------------------------------

export function orderConfirmationEmail(locale: Locale, order: OrderEmailData, storeInfo: StoreContactInfo) {
  const subject =
    locale === "en"
      ? `Order confirmed ${orderRef(order.orderId)} — ${storeInfo.en.name}`
      : `Commande confirmée ${orderRef(order.orderId)} — ${storeInfo.fr.name}`;
  const name = escapeHtml(order.customerName);

  const body =
    locale === "en"
      ? `${p(`Hi ${name},`)}
         ${p(`Thanks for your purchase! We've received your payment for order <strong>${orderRef(order.orderId)}</strong>.`)}
         ${itemsTable(order.items, locale)}
         ${taxSummary(order, locale)}
         ${callout("Our team will start preparing your order shortly — you'll get an email as soon as it's ready for pickup.")}`
      : `${p(`Bonjour ${name},`)}
         ${p(`Merci pour votre achat! Nous avons bien reçu votre paiement pour la commande <strong>${orderRef(order.orderId)}</strong>.`)}
         ${itemsTable(order.items, locale)}
         ${taxSummary(order, locale)}
         ${callout("Notre équipe va commencer à préparer votre commande sous peu — vous recevrez un courriel dès qu'elle sera prête à être récupérée.")}`;

  return {
    subject,
    html: shell(locale, locale === "en" ? "Order confirmed" : "Commande confirmée", body, storeInfo, {
      preheader: locale === "en" ? `We got your payment — order ${orderRef(order.orderId)}` : `Paiement reçu — commande ${orderRef(order.orderId)}`,
    }),
  };
}

export function orderPreparingEmail(locale: Locale, order: OrderEmailData, storeInfo: StoreContactInfo) {
  const subject =
    locale === "en"
      ? `Your order ${orderRef(order.orderId)} is being prepared`
      : `Votre commande ${orderRef(order.orderId)} est en préparation`;
  const name = escapeHtml(order.customerName);

  const body =
    locale === "en"
      ? `${p(`Hi ${name},`)}
         ${p(`Good news — we've started preparing your order <strong>${orderRef(order.orderId)}</strong>. Keep an eye on your inbox: we'll let you know as soon as it's ready for pickup.`)}`
      : `${p(`Bonjour ${name},`)}
         ${p(`Bonne nouvelle — nous avons commencé à préparer votre commande <strong>${orderRef(order.orderId)}</strong>. Restez à l'affût : nous vous avisons dès qu'elle sera prête à être récupérée.`)}`;

  return {
    subject,
    html: shell(locale, locale === "en" ? "We're preparing your order" : "Votre commande est en préparation", body, storeInfo, {
      preheader: subject,
    }),
  };
}

export function orderReadyForPickupEmail(
  locale: Locale,
  order: OrderEmailData,
  deadline: Date,
  cancellationFeePercent: number,
  storeInfo: StoreContactInfo,
  hasCrickets = false,
) {
  const info = storeInfo[locale];
  // Crickets have a strict 48 h window, so the time of day matters.
  const deadlineStr = deadline.toLocaleString(locale === "en" ? "en-CA" : "fr-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Toronto",
    ...(hasCrickets ? { hour: "numeric", minute: "2-digit", timeZoneName: "short" } : {}),
  });
  const cricketsNote =
    locale === "en"
      ? p("Your order includes crickets, which must be picked up within 48 hours.", `font-size:13px;color:${BRAND.muted};`)
      : p("Votre commande contient des grillons, à récupérer dans un délai de 48 heures.", `font-size:13px;color:${BRAND.muted};`);

  const subject =
    locale === "en"
      ? `Your order ${orderRef(order.orderId)} is ready for pickup!`
      : `Votre commande ${orderRef(order.orderId)} est prête à être récupérée!`;
  const name = escapeHtml(order.customerName);

  const body =
    locale === "en"
      ? `${p(`Hi ${name},`)}
         ${p(`Your order <strong>${orderRef(order.orderId)}</strong> is ready for pickup at our Lachine location.`)}
         ${callout(`<strong>Hours:</strong> ${info.hours}<br/><strong>Address:</strong> ${info.address}`)}
         ${itemsTable(order.items, locale)}
         ${callout(
           `Please pick up your order by <strong>${deadlineStr}</strong>. After this date, the order will be automatically cancelled and refunded, minus a ${cancellationFeePercent}% cancellation fee.`,
         )}
         ${hasCrickets ? cricketsNote : ""}`
      : `${p(`Bonjour ${name},`)}
         ${p(`Votre commande <strong>${orderRef(order.orderId)}</strong> est prête à être récupérée à notre boutique de Lachine.`)}
         ${callout(`<strong>Horaires :</strong> ${info.hours}<br/><strong>Adresse :</strong> ${info.address}`)}
         ${itemsTable(order.items, locale)}
         ${callout(
           `Merci de récupérer votre commande avant le <strong>${deadlineStr}</strong>. Passé ce délai, la commande sera automatiquement annulée et remboursée, moins des frais d'annulation de ${cancellationFeePercent}%.`,
         )}
         ${hasCrickets ? cricketsNote : ""}`;

  return {
    subject,
    html: shell(locale, locale === "en" ? "Ready for pickup!" : "Prête à être récupérée!", body, storeInfo, {
      preheader: subject,
    }),
  };
}

export function orderPickedUpEmail(
  locale: Locale,
  order: OrderEmailData,
  reviewUrl: string,
  storeInfo: StoreContactInfo,
) {
  const subject =
    locale === "en"
      ? `Thanks for picking up order ${orderRef(order.orderId)}!`
      : `Merci d'être passé chercher la commande ${orderRef(order.orderId)}!`;
  const name = escapeHtml(order.customerName);

  const body =
    locale === "en"
      ? `${p(`Hi ${name},`)}
         ${p("We hope you enjoyed picking up your order and that everything is to your satisfaction!")}
         ${p("If you have a minute, we'd love to hear about your experience:")}
         ${button(reviewUrl, "Leave a review")}`
      : `${p(`Bonjour ${name},`)}
         ${p("Nous espérons que tout s'est bien passé et que vous êtes satisfait de votre commande!")}
         ${p("Si vous avez un instant, nous aimerions connaître votre expérience :")}
         ${button(reviewUrl, "Laisser un avis")}`;

  return {
    subject,
    html: shell(locale, locale === "en" ? "Thank you!" : "Merci!", body, storeInfo, { preheader: subject }),
  };
}

export function orderExpiredEmail(
  locale: Locale,
  order: OrderEmailData,
  refundAmountCAD: number,
  feeAmountCAD: number,
  storeInfo: StoreContactInfo,
) {
  const subject =
    locale === "en"
      ? `Order ${orderRef(order.orderId)} cancelled — pickup window expired`
      : `Commande ${orderRef(order.orderId)} annulée — délai de récupération expiré`;
  const name = escapeHtml(order.customerName);

  const body =
    locale === "en"
      ? `${p(`Hi ${name},`)}
         ${p(`Your order <strong>${orderRef(order.orderId)}</strong> wasn't picked up within the allowed window, so it has been cancelled.`)}
         ${callout(`You'll be refunded <strong>${refundAmountCAD.toFixed(2)} $ CAD</strong> (a cancellation fee of ${feeAmountCAD.toFixed(2)} $ CAD was withheld).`)}
         ${p("If you still want these items, feel free to place a new order.")}`
      : `${p(`Bonjour ${name},`)}
         ${p(`Votre commande <strong>${orderRef(order.orderId)}</strong> n'a pas été récupérée dans le délai prévu et a donc été annulée.`)}
         ${callout(`Vous serez remboursé de <strong>${refundAmountCAD.toFixed(2)} $ CAD</strong> (des frais d'annulation de ${feeAmountCAD.toFixed(2)} $ CAD ont été retenus).`)}
         ${p("Si les articles vous intéressent toujours, n'hésitez pas à passer une nouvelle commande.")}`;

  return {
    subject,
    html: shell(locale, locale === "en" ? "Order cancelled" : "Commande annulée", body, storeInfo, { preheader: subject }),
  };
}

export function backInStockEmail(
  product: { nameFr: string; nameEn: string },
  productUrl: string,
  storeInfo: StoreContactInfo,
) {
  const subjectFr = `${product.nameFr} est de retour en stock!`;
  const subjectEn = `${product.nameEn} is back in stock!`;

  const bodyFr = `
    ${p(`Bonne nouvelle! <strong>${escapeHtml(product.nameFr)}</strong> est de nouveau disponible.`)}
    ${button(productUrl, "Voir le produit")}
    ${small("Le stock est limité — nous vous recommandons de commander rapidement.")}`;
  const bodyEn = `
    ${p(`Good news! <strong>${escapeHtml(product.nameEn)}</strong> is available again.`)}
    ${button(productUrl, "View the product")}
    ${small("Stock is limited — we recommend ordering soon.")}`;

  return {
    subject: `${subjectFr} / ${subjectEn}`,
    html: shell("fr", "De retour en stock! / Back in stock!", `${bodyFr}${divider()}${bodyEn}`, storeInfo, {
      preheader: `${subjectFr} / ${subjectEn}`,
    }),
  };
}

// Welcome email sent on newsletter signup. It carries the welcome-gift promo
// code, so it follows the look of the original launch announcement.
export function newsletterConfirmationEmail(
  locale: Locale,
  opts: { unsubscribeUrl: string; shopUrl: string; promoCode?: string },
  storeInfo: StoreContactInfo,
) {
  const name = storeInfo[locale].name;
  const { unsubscribeUrl, shopUrl, promoCode } = opts;
  const codeBox = (html: string) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td align="center" style="padding:20px 16px;background:${BRAND.accentLight};border:2px dashed ${BRAND.accent};border-radius:14px;">${html}</td></tr></table>`;
  const code = promoCode
    ? `<p style="margin:10px 0 0;font-family:${FONT_DISPLAY};font-size:28px;letter-spacing:3px;font-weight:700;color:${BRAND.primary};">${escapeHtml(promoCode)}</p>`
    : "";

  if (locale === "en") {
    const subject = promoCode
      ? `You're on the list — a 15% welcome gift from ${name}`
      : `You're on the list — ${name}`;
    const body = `
      ${p(`Thanks for signing up! You'll be the first to know about new arrivals, restocks, and news from ${name}.`)}
      ${
        promoCode
          ? codeBox(`<p style="margin:0;font-size:15px;">🎁 <strong>Your welcome gift: 15% off your first purchase</strong></p>
        ${code}
        <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:${BRAND.muted};">Valid until December 31, 2026. Enter it at checkout using the same email you subscribed with — this gift is reserved for our newsletter subscribers.</p>`)
          : ""
      }
      ${button(shopUrl, "Visit the shop")}
      ${callout(`<strong>📍 In-store pickup only.</strong> We don't deliver at the moment: you pay online, then pick up your order at our Lachine, QC shop. Orders must be picked up within 5 business days of the "ready for pickup" email — crickets within 48 hours.`)}`;
    return {
      subject,
      html: shell(locale, "You're subscribed!", body, storeInfo, {
        preheader: subject,
        footerNote: `Didn't sign up for this? <a href="${unsubscribeUrl}" style="color:#ffffff;text-decoration:underline;">Unsubscribe</a>`,
      }),
    };
  }

  const subject = promoCode
    ? `Inscription confirmée — un cadeau de 15 % de ${name} pour vous`
    : `Inscription confirmée — ${name}`;
  const body = `
      ${p(`Merci de votre inscription! Vous serez parmi les premiers informés des nouveautés, réapprovisionnements et actualités de ${name}.`)}
      ${
        promoCode
          ? codeBox(`<p style="margin:0;font-size:15px;">🎁 <strong>Votre cadeau de bienvenue : 15 % de rabais sur votre première commande</strong></p>
        ${code}
        <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:${BRAND.muted};">Valide jusqu'au 31 décembre 2026. Entrez-le à la caisse avec le même courriel que votre inscription à l'infolettre — ce cadeau est réservé à nos abonnés.</p>`)
          : ""
      }
      ${button(shopUrl, "Visiter la boutique")}
      ${callout(`<strong>📍 Retrait en boutique seulement.</strong> Nous ne livrons pas pour le moment : vous payez en ligne, puis vous récupérez votre commande à notre boutique de Lachine, QC. Votre commande est à récupérer dans les 5 jours ouvrables suivant le courriel « prête pour retrait » — les grillons, dans les 48 heures.`)}`;
  return {
    subject,
    html: shell(locale, "Inscription confirmée!", body, storeInfo, {
      preheader: subject,
      footerNote: `Vous n'êtes pas à l'origine de cette inscription? <a href="${unsubscribeUrl}" style="color:#ffffff;text-decoration:underline;">Se désabonner</a>`,
    }),
  };
}

type PosReceiptData = {
  saleId: string;
  createdAt: Date;
  paymentMethod: string;
  items: OrderEmailItem[];
  subtotalCAD: number;
  gstAmountCAD: number;
  qstAmountCAD: number;
  totalCAD: number;
  gstNumber: string | null;
  qstNumber: string | null;
};

export function posReceiptEmail(sale: PosReceiptData, storeInfo: StoreContactInfo) {
  const ref = `#${sale.saleId.slice(0, 8)}`;
  const dateStr = sale.createdAt.toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto" });
  const methodLabel = sale.paymentMethod === "card" ? "Carte" : "Comptant";
  const subject = `Reçu ${ref} — ${sale.totalCAD.toFixed(2)} $ CAD — ${storeInfo.fr.name}`;

  const body = `
    ${p(`Merci pour votre achat chez ${escapeHtml(storeInfo.fr.name)}!`)}
    ${p(`Reçu ${ref} — ${dateStr} — Paiement : ${methodLabel}`, `font-size:13px;color:${BRAND.muted};`)}
    ${itemsTable(sale.items, "fr")}
    ${totalsTable(
      [
        ["Sous-total", sale.subtotalCAD],
        [`TPS${sale.gstNumber ? ` (${escapeHtml(sale.gstNumber)})` : ""}`, sale.gstAmountCAD],
        [`TVQ${sale.qstNumber ? ` (${escapeHtml(sale.qstNumber)})` : ""}`, sale.qstAmountCAD],
      ],
      sale.totalCAD,
    )}`;

  return { subject, html: shell("fr", "Votre reçu", body, storeInfo, { preheader: subject }) };
}

/**
 * Wraps a marketing campaign body (written in the admin campaign editor) in the
 * branded layout. The body is admin-authored, so plain lines become paragraphs
 * and any HTML the admin typed is kept as-is.
 */
export function campaignEmail(locale: Locale, subject: string, body: string, storeInfo: StoreContactInfo) {
  const paragraphs = body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => p(line))
    .join("");
  return { subject, html: shell(locale, subject, paragraphs, storeInfo, { preheader: subject }) };
}

// ---------------------------------------------------------------------------
// Admin emails (same layout, flagged with an "Admin" pill)
// ---------------------------------------------------------------------------

export function adminNewSaleEmail(order: OrderEmailData, adminOrderUrl: string, storeInfo: StoreContactInfo) {
  const subject = `Nouvelle vente ${orderRef(order.orderId)} — ${order.totalCAD.toFixed(2)} $ CAD`;
  const body = `
    ${p(`Nouvelle commande payée de <strong>${escapeHtml(order.customerName)}</strong>.`)}
    ${itemsTable(order.items, "fr")}
    ${taxSummary(order, "fr")}
    ${p("Cliquez sur « Préparation » dans le panel admin pour commencer.")}
    ${button(adminOrderUrl, "Voir la commande")}`;
  return {
    subject,
    html: shell("fr", `Nouvelle vente ${orderRef(order.orderId)}`, body, storeInfo, { admin: true, preheader: subject }),
  };
}

export type ReviewEmailData = {
  orderId: string;
  customerName: string;
  rating: number;
  comment: string | null;
  itemRatings: { name: string; rating: number }[];
};

function stars(rating: number) {
  return `${"★".repeat(rating)}${"☆".repeat(Math.max(0, 5 - rating))} (${rating}/5)`;
}

export function adminNewReviewEmail(review: ReviewEmailData, adminReviewsUrl: string, storeInfo: StoreContactInfo) {
  const subject = `Nouvel avis ${review.rating}/5 — commande ${orderRef(review.orderId)}`;
  const itemsHtml =
    review.itemRatings.length > 0
      ? `<ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.8;">${review.itemRatings
          .map((item) => `<li>${escapeHtml(item.name)} : <span style="color:${BRAND.accent};">${stars(item.rating)}</span></li>`)
          .join("")}</ul>`
      : "";
  const commentHtml = review.comment
    ? `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:4px solid ${BRAND.primary};background:${BRAND.surface};border-radius:0 10px 10px 0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(review.comment)}</blockquote>`
    : p("(Aucun commentaire)", `color:${BRAND.muted};`);
  const body = `
    ${p(`<strong>${escapeHtml(review.customerName)}</strong> a laissé un avis sur la commande ${orderRef(review.orderId)}.`)}
    <p style="margin:0 0 16px;font-size:22px;color:${BRAND.accent};">${stars(review.rating)}</p>
    ${itemsHtml}
    ${commentHtml}
    ${callout("L'avis n'est pas publié tant que vous ne l'approuvez pas.")}
    ${button(adminReviewsUrl, "Modérer les avis")}`;
  return {
    subject,
    html: shell("fr", `Nouvel avis ${review.rating}/5`, body, storeInfo, { admin: true, preheader: subject }),
  };
}
