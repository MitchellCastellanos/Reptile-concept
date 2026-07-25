"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { chargeCloverTerminal } from "@/lib/clover";

type SaleLineInput = {
  type: "animal" | "product";
  id: string;
  quantity: number;
};

export type PosSaleResult = { error?: string; success?: boolean };

export async function recordPosSaleAction(
  _prevState: PosSaleResult | undefined,
  formData: FormData,
): Promise<PosSaleResult> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const cartJson = String(formData.get("cartJson") ?? "[]");
  const paymentMethod = String(formData.get("paymentMethod") ?? "cash") as "cash" | "card";
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

  const amountCAD = cart.reduce((sum, line) => {
    if (line.type === "animal") {
      return sum + Number(animals.find((a) => a.id === line.id)!.priceCAD);
    }
    const product = products.find((p) => p.id === line.id)!;
    return sum + Number(product.priceCAD) * line.quantity;
  }, 0);

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
          amountCAD,
          createdByAdminId: admin.id,
        },
      });
      return { error: `Paiement refusé par le terminal Clover : ${result.error}` };
    }
    cloverTransactionId = result.transactionId;
  }

  await prisma.$transaction(async (tx) => {
    const sale = await tx.posSale.create({
      data: {
        paymentMethod,
        status: "completed",
        amountCAD,
        cloverTransactionId,
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
        note: "Vente en magasin",
      },
    });
  });

  await recordAudit(admin.id, "PosSale", admin.id, "create");
  revalidatePath("/admin/pos");
  revalidatePath("/admin/finance");
  revalidatePath("/animals");
  revalidatePath("/boutique");

  return { success: true };
}
