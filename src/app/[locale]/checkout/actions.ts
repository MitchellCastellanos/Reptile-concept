"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

type CartLineInput = {
  type: "animal" | "product";
  id: string;
  quantity: number;
};

export async function placeOrderAction(formData: FormData) {
  const cartJson = String(formData.get("cartJson") ?? "[]");
  const cart: CartLineInput[] = JSON.parse(cartJson);
  if (cart.length === 0) {
    throw new Error("Le panier est vide / Cart is empty");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const preferredLang = String(formData.get("preferredLang") ?? "fr") as "fr" | "en";
  const street = String(formData.get("street") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const healthGuaranteeAccepted = formData.get("healthGuaranteeAccepted") === "on";

  if (!fullName || !email || !street || !city || !province || !postalCode) {
    throw new Error("Champs requis manquants / Missing required fields");
  }
  if (!healthGuaranteeAccepted) {
    throw new Error(
      "Vous devez accepter la politique de garantie de santé / You must accept the health guarantee policy",
    );
  }

  // Re-fetch canonical data server-side — never trust client-submitted prices/availability.
  const animalIds = cart.filter((l) => l.type === "animal").map((l) => l.id);
  const productIds = cart.filter((l) => l.type === "product").map((l) => l.id);

  const [animals, products] = await Promise.all([
    animalIds.length
      ? prisma.animal.findMany({ where: { id: { in: animalIds } } })
      : Promise.resolve([]),
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds } } })
      : Promise.resolve([]),
  ]);

  for (const line of cart) {
    if (line.type === "animal") {
      const animal = animals.find((a) => a.id === line.id);
      if (!animal || animal.status !== "available") {
        throw new Error(`Animal non disponible / Animal not available: ${line.id}`);
      }
    } else {
      const product = products.find((p) => p.id === line.id);
      if (!product || product.stockQty < line.quantity) {
        throw new Error(`Stock insuffisant / Insufficient stock: ${line.id}`);
      }
    }
  }

  const totalCAD = cart.reduce((sum, line) => {
    if (line.type === "animal") {
      const animal = animals.find((a) => a.id === line.id)!;
      return sum + Number(animal.priceCAD);
    }
    const product = products.find((p) => p.id === line.id)!;
    return sum + Number(product.priceCAD) * line.quantity;
  }, 0);

  const orderId = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { email },
      update: { fullName, phone, preferredLang },
      create: { fullName, email, phone, preferredLang, ageVerified: true },
    });

    const address = await tx.address.create({
      data: { customerId: customer.id, street, city, province, postalCode },
    });

    const order = await tx.order.create({
      data: {
        customerId: customer.id,
        shippingAddressId: address.id,
        status: "pending_payment",
        healthGuaranteeAcceptedAt: new Date(),
      },
    });

    for (const line of cart) {
      if (line.type === "animal") {
        const animal = animals.find((a) => a.id === line.id)!;
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            animalId: animal.id,
            quantity: 1,
            priceAtSaleCAD: animal.priceCAD,
          },
        });
        await tx.animal.update({ where: { id: animal.id }, data: { status: "reserved" } });
      } else {
        const product = products.find((p) => p.id === line.id)!;
        await tx.orderItem.create({
          data: {
            orderId: order.id,
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

    // MVP placeholder: no live payment processor is wired up yet (see README —
    // several providers restrict live-animal sales, needs validation before going live).
    // The order is recorded as pending_payment until staff confirm payment manually.
    await tx.payment.create({
      data: {
        orderId: order.id,
        amountCAD: totalCAD,
        provider: "manual",
        status: "pending",
      },
    });

    return order.id;
  });

  redirect(`/checkout/confirmation/${orderId}`);
}
