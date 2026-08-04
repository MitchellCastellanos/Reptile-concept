import { prisma } from "@/lib/db";
import { pushSoldItemsToClover } from "@/lib/clover-sync";
import { sendOrderConfirmationEmail, sendAdminNewSaleEmail } from "@/lib/order-notifications";
import { restoreOrderInventory } from "@/lib/orders";
import { pointsForSubtotal } from "@/lib/loyalty";

export type CartLineInput = {
  type: "animal" | "product";
  id: string;
  quantity: number;
};

export type ValidatedCart = {
  cart: CartLineInput[];
  animals: Awaited<ReturnType<typeof loadAnimals>>;
  products: Awaited<ReturnType<typeof loadProducts>>;
  subtotalCAD: number;
};

async function loadAnimals(ids: string[]) {
  return ids.length
    ? prisma.animal.findMany({ where: { id: { in: ids } }, include: { species: true } })
    : Promise.resolve([]);
}

async function loadProducts(ids: string[]) {
  return ids.length
    ? prisma.product.findMany({ where: { id: { in: ids } } })
    : Promise.resolve([]);
}

export async function validateCartLines(cart: CartLineInput[]): Promise<ValidatedCart> {
  if (cart.length === 0) {
    throw new Error("Le panier est vide / Cart is empty");
  }

  const animalIds = cart.filter((l) => l.type === "animal").map((l) => l.id);
  const productIds = cart.filter((l) => l.type === "product").map((l) => l.id);
  const [animals, products] = await Promise.all([loadAnimals(animalIds), loadProducts(productIds)]);

  for (const line of cart) {
    if (line.type === "animal") {
      const animal = animals.find((a) => a.id === line.id);
      if (!animal || animal.status !== "available") {
        throw new Error(`Animal non disponible / Animal not available: ${line.id}`);
      }
    } else {
      const product = products.find((p) => p.id === line.id);
      if (!product || !product.published || product.stockQty < line.quantity) {
        throw new Error(`Stock insuffisant / Insufficient stock: ${line.id}`);
      }
    }
  }

  const subtotalCAD = cart.reduce((sum, line) => {
    if (line.type === "animal") {
      const animal = animals.find((a) => a.id === line.id)!;
      return sum + Number(animal.priceCAD);
    }
    const product = products.find((p) => p.id === line.id)!;
    return sum + Number(product.priceCAD) * line.quantity;
  }, 0);

  return { cart, animals, products, subtotalCAD };
}

type CreateOrderInput = {
  fullName: string;
  email: string;
  phone: string;
  preferredLang: "fr" | "en";
  street: string;
  city: string;
  province: string;
  postalCode: string;
  // When set and it resolves to an Address owned by this customer, that
  // saved address is reused instead of creating a new one from the
  // street/city/province/postalCode fields above.
  addressId?: string;
  validated: ValidatedCart;
  gstAmountCAD: number;
  qstAmountCAD: number;
  totalCAD: number;
};

async function resolveShippingAddress(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  customerId: string,
  input: CreateOrderInput,
) {
  if (input.addressId) {
    const existing = await tx.address.findFirst({ where: { id: input.addressId, customerId } });
    if (existing) return existing;
  }
  return tx.address.create({
    data: {
      customerId,
      street: input.street,
      city: input.city,
      province: input.province,
      postalCode: input.postalCode,
    },
  });
}

async function writeOrderItems(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  orderId: string,
  validated: ValidatedCart,
  reserveInventory: boolean,
) {
  for (const line of validated.cart) {
    if (line.type === "animal") {
      const animal = validated.animals.find((a) => a.id === line.id)!;
      await tx.orderItem.create({
        data: {
          orderId,
          animalId: animal.id,
          quantity: 1,
          priceAtSaleCAD: animal.priceCAD,
        },
      });
      if (reserveInventory) {
        await tx.animal.update({
          where: { id: animal.id },
          data: { status: "reserved" },
        });
      } else {
        await tx.animal.update({
          where: { id: animal.id },
          data: { status: "sold" },
        });
      }
    } else {
      const product = validated.products.find((p) => p.id === line.id)!;
      await tx.orderItem.create({
        data: {
          orderId,
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
}

export async function createPendingPaymentOrder(input: CreateOrderInput) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { email: input.email },
      update: {
        fullName: input.fullName,
        phone: input.phone,
        preferredLang: input.preferredLang,
      },
      create: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        preferredLang: input.preferredLang,
        ageVerified: true,
      },
    });

    const address = await resolveShippingAddress(tx, customer.id, input);

    const order = await tx.order.create({
      data: {
        customerId: customer.id,
        shippingAddressId: address.id,
        status: "pending_payment",
        healthGuaranteeAcceptedAt: new Date(),
        subtotalCAD: input.validated.subtotalCAD,
        gstAmountCAD: input.gstAmountCAD,
        qstAmountCAD: input.qstAmountCAD,
        totalCAD: input.totalCAD,
      },
    });

    await writeOrderItems(tx, order.id, input.validated, true);

    await tx.payment.create({
      data: {
        orderId: order.id,
        amountCAD: input.totalCAD,
        provider: "stripe",
        status: "pending",
      },
    });

    return order.id;
  });
}

export async function createManualPaidOrder(input: CreateOrderInput) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { email: input.email },
      update: {
        fullName: input.fullName,
        phone: input.phone,
        preferredLang: input.preferredLang,
      },
      create: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        preferredLang: input.preferredLang,
        ageVerified: true,
      },
    });

    const address = await resolveShippingAddress(tx, customer.id, input);

    const order = await tx.order.create({
      data: {
        customerId: customer.id,
        shippingAddressId: address.id,
        status: "paid",
        healthGuaranteeAcceptedAt: new Date(),
        subtotalCAD: input.validated.subtotalCAD,
        gstAmountCAD: input.gstAmountCAD,
        qstAmountCAD: input.qstAmountCAD,
        totalCAD: input.totalCAD,
      },
    });

    await writeOrderItems(tx, order.id, input.validated, false);

    await tx.payment.create({
      data: {
        orderId: order.id,
        amountCAD: input.totalCAD,
        provider: "manual",
        status: "succeeded",
        paidAt: new Date(),
      },
    });

    await tx.customer.update({
      where: { id: customer.id },
      data: { loyaltyPoints: { increment: pointsForSubtotal(input.validated.subtotalCAD) } },
    });

    return order.id;
  });
}

export async function fulfillPaidOrder(
  orderId: string,
  stripeRefs: { checkoutSessionId?: string; paymentIntentId?: string },
) {
  const fulfilled = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });
    if (!order) return { status: "missing" as const };
    if (order.status !== "pending_payment") {
      return { status: "already_handled" as const, orderStatus: order.status };
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "paid" },
    });

    await tx.customer.update({
      where: { id: order.customerId },
      data: { loyaltyPoints: { increment: pointsForSubtotal(Number(order.subtotalCAD ?? 0)) } },
    });

    for (const item of order.items) {
      if (item.animalId) {
        await tx.animal.updateMany({
          where: { id: item.animalId, status: { in: ["reserved", "available"] } },
          data: { status: "sold" },
        });
      }
    }

    const pendingPayment = order.payments.find((p) => p.status === "pending");
    if (pendingPayment) {
      await tx.payment.update({
        where: { id: pendingPayment.id },
        data: {
          status: "succeeded",
          provider: "stripe",
          providerRef: stripeRefs.paymentIntentId ?? stripeRefs.checkoutSessionId ?? null,
          paidAt: new Date(),
        },
      });
    }

    return { status: "fulfilled" as const };
  });

  if (fulfilled.status !== "fulfilled") {
    return fulfilled;
  }

  try {
    await Promise.all([sendOrderConfirmationEmail(orderId), sendAdminNewSaleEmail(orderId)]);
  } catch (err) {
    console.error("[order-payment] failed to send order notification emails:", err);
  }

  await pushCloverStockForOrder(orderId);
  return fulfilled;
}

export async function cancelPendingOrder(orderId: string, reason: string) {
  const cancelled = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== "pending_payment") return false;

    await restoreOrderInventory(tx, orderId);

    await tx.order.update({
      where: { id: orderId },
      data: { status: "cancelled", cancelledAt: new Date() },
    });
    await tx.payment.updateMany({
      where: { orderId, status: "pending" },
      data: { status: "failed" },
    });

    return true;
  });

  return cancelled;
}

export async function pushCloverStockForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { animal: true, product: true },
      },
    },
  });
  if (!order) return;

  await pushSoldItemsToClover(
    order.items.flatMap((item) => {
      if (item.animal?.cloverItemId) {
        return [{ cloverItemId: item.animal.cloverItemId, nextStockQty: 0 }];
      }
      if (item.product?.cloverItemId) {
        return [{ cloverItemId: item.product.cloverItemId, nextStockQty: item.product.stockQty }];
      }
      return [];
    }),
  );
}

export function buildStripeLineItems(
  validated: ValidatedCart,
  locale: "fr" | "en",
): { name: string; unitAmountCAD: number; quantity: number }[] {
  return validated.cart.map((line) => {
    if (line.type === "animal") {
      const animal = validated.animals.find((a) => a.id === line.id)!;
      const speciesName =
        locale === "en" ? animal.species.commonNameEn : animal.species.commonNameFr;
      return { name: `${speciesName} — ${animal.morph}`, unitAmountCAD: Number(animal.priceCAD), quantity: 1 };
    }
    const product = validated.products.find((p) => p.id === line.id)!;
    const name = locale === "en" ? product.nameEn : product.nameFr;
    return { name, unitAmountCAD: Number(product.priceCAD), quantity: line.quantity };
  });
}
