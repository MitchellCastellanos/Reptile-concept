"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { chargeCloverTerminal } from "@/lib/clover";
import { getStoreSettings } from "@/lib/settings";
import { computeTax } from "@/lib/tax";
import { sendEmail } from "@/lib/email";
import { posReceiptEmail } from "@/lib/email-templates";

type SaleLineInput = {
  type: "animal" | "product";
  id: string;
  quantity: number;
};

export type PosSaleResult = { error?: string; success?: boolean; posSaleId?: string };

export async function recordPosSaleAction(
  _prevState: PosSaleResult | undefined,
  formData: FormData,
): Promise<PosSaleResult> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const cartJson = String(formData.get("cartJson") ?? "[]");
  const paymentMethod = String(formData.get("paymentMethod") ?? "cash") as "cash" | "card";
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim().toLowerCase();
  const cart: SaleLineInput[] = JSON.parse(cartJson);

  if (cart.length === 0) {
    return { error: "Ajoutez au moins un article à la vente." };
  }

  // Re-fetch canonical price/availability server-side — same discipline as
  // the online checkout. The platform is the single source of truth for
  // inventory, whether the sale happens online or in person.
  const animalIds = cart.filter((l) => l.type === "animal").map((l) => l.id);
  const productIds = cart.filter((l) => l.type === "product").map((l) => l.id);

  const [animals, products] = await Promise.all([
    animalIds.length ? prisma.animal.findMany({ where: { id: { in: animalIds } } }) : [],
    productIds.length ? prisma.product.findMany({ where: { id: { in: productIds } } }) : [],
  ]);

  for (const line of cart) {
    if (line.type === "animal") {
      const animal = animals.find((a) => a.id === line.id);
      if (!animal || animal.status !== "available") {
        return { error: `Animal non disponible : ${line.id}` };
      }
    } else {
      const product = products.find((p) => p.id === line.id);
      if (!product || product.stockQty < line.quantity) {
        return { error: `Stock insuffisant : ${line.id}` };
      }
    }
  }

  const subtotalCAD = cart.reduce((sum, line) => {
    if (line.type === "animal") {
      return sum + Number(animals.find((a) => a.id === line.id)!.priceCAD);
    }
    const product = products.find((p) => p.id === line.id)!;
    return sum + Number(product.priceCAD) * line.quantity;
  }, 0);

  const settings = await getStoreSettings();
  const { gstAmountCAD, qstAmountCAD, totalCAD: amountCAD } = computeTax(subtotalCAD, {
    gstRatePercent: Number(settings.gstRatePercent),
    qstRatePercent: Number(settings.qstRatePercent),
  });

  let cloverTransactionId: string | undefined;
  if (paymentMethod === "card") {
    const result = await chargeCloverTerminal({
      amountCAD,
      description: `Vente en magasin — Reptile Concept`,
    });
    if (!result.success) {
      await prisma.posSale.create({
        data: {
          paymentMethod: "card",
          status: "failed",
          subtotalCAD,
          gstAmountCAD,
          qstAmountCAD,
          amountCAD,
          createdByAdminId: admin.id,
        },
      });
      return { error: `Paiement refusé par le terminal Clover : ${result.error}` };
    }
    cloverTransactionId = result.transactionId;
  }

  const saleId = await prisma.$transaction(async (tx) => {
    const sale = await tx.posSale.create({
      data: {
        paymentMethod,
        status: "completed",
        subtotalCAD,
        gstAmountCAD,
        qstAmountCAD,
        amountCAD,
        cloverTransactionId,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        createdByAdminId: admin.id,
      },
    });

    for (const line of cart) {
      if (line.type === "animal") {
        const animal = animals.find((a) => a.id === line.id)!;
        await tx.posSaleItem.create({
          data: { posSaleId: sale.id, animalId: animal.id, quantity: 1, priceAtSaleCAD: animal.priceCAD },
        });
        await tx.animal.update({ where: { id: animal.id }, data: { status: "sold" } });
      } else {
        const product = products.find((p) => p.id === line.id)!;
        await tx.posSaleItem.create({
          data: {
            posSaleId: sale.id,
            productId: product.id,
            quantity: line.quantity,
            priceAtSaleCAD: product.priceCAD,
          },
        });
        await tx.product.update({
          where: { id: product.id },
          data: { stockQty: { decrement: line.quantity } },
        });
      }
    }

    await tx.financialRecord.create({
      data: {
        posSaleId: sale.id,
        type: "sale",
        channel: "in_store",
        paymentMethod,
        amountCAD,
        gstAmountCAD,
        qstAmountCAD,
        note: "Vente en magasin",
      },
    });

    return sale.id;
  });

  await recordAudit(admin.id, "PosSale", saleId, "create");
  revalidatePath("/admin/pos");
  revalidatePath("/admin/finance");
  revalidatePath("/animals");
  revalidatePath("/boutique");

  return { success: true, posSaleId: saleId };
}

export type SendReceiptResult = { error?: string; success?: boolean };

export async function sendPosReceiptEmailAction(
  posSaleId: string,
  _prevState: SendReceiptResult | undefined,
  formData: FormData,
): Promise<SendReceiptResult> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return { error: "Un courriel est requis pour envoyer le reçu." };
  }

  const sale = await prisma.posSale.findUnique({
    where: { id: posSaleId },
    include: {
      items: { include: { animal: { include: { species: true } }, product: true } },
    },
  });
  if (!sale) {
    return { error: "Vente introuvable." };
  }

  const settings = await getStoreSettings();
  const { subject, html } = posReceiptEmail({
    saleId: sale.id,
    createdAt: sale.createdAt,
    paymentMethod: sale.paymentMethod,
    items: sale.items.map((item) => ({
      name: item.animal
        ? `${item.animal.species.commonNameFr} — ${item.animal.morph}`
        : (item.product?.nameFr ?? ""),
      quantity: item.quantity,
      priceCAD: Number(item.priceAtSaleCAD),
    })),
    subtotalCAD: Number(sale.subtotalCAD ?? 0),
    gstAmountCAD: Number(sale.gstAmountCAD ?? 0),
    qstAmountCAD: Number(sale.qstAmountCAD ?? 0),
    totalCAD: Number(sale.amountCAD),
    gstNumber: settings.gstNumber,
    qstNumber: settings.qstNumber,
  });

  await sendEmail({ to: email, subject, html });

  return { success: true };
}
