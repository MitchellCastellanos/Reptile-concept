"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createCustomerSession, destroyCustomerSession, getCurrentCustomer } from "@/lib/customer-auth";

export async function registerAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || password.length < 8) {
    return { error: "Nom, courriel et un mot de passe d'au moins 8 caractères sont requis." };
  }

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    return { error: "Un compte existe déjà avec ce courriel. Essayez de vous connecter." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const customer = existing
    ? await prisma.customer.update({ where: { id: existing.id }, data: { passwordHash, fullName } })
    : await prisma.customer.create({
        data: { fullName, email, passwordHash, ageVerified: true },
      });

  await createCustomerSession(customer.id);
  redirect("/account");
}

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const customer = email ? await prisma.customer.findUnique({ where: { email } }) : null;
  const valid = customer?.passwordHash
    ? await bcrypt.compare(password, customer.passwordHash)
    : false;

  if (!customer || !valid) {
    return { error: "Courriel ou mot de passe invalide." };
  }

  await createCustomerSession(customer.id);
  redirect("/account");
}

export async function logoutAction() {
  await destroyCustomerSession();
  redirect("/");
}

export async function toggleWishlistAction(
  type: "animal" | "product",
  itemId: string,
) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  const existing = await prisma.wishlistItem.findFirst({
    where: {
      customerId: customer.id,
      ...(type === "animal" ? { animalId: itemId } : { productId: itemId }),
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({
      data: {
        customerId: customer.id,
        animalId: type === "animal" ? itemId : undefined,
        productId: type === "product" ? itemId : undefined,
      },
    });
  }

  revalidatePath("/account/wishlist");
  revalidatePath("/animals");
  revalidatePath("/boutique");
}
