"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { createVerificationToken } from "@/lib/account-verification";
import { createCustomerSession, destroyCustomerSession, getCurrentCustomer } from "@/lib/customer-auth";

function escapeHtml(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function registerAction(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData,
) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || password.length < 8) {
    return { error: "Nom, courriel et un mot de passe d'au moins 8 caractères sont requis." };
  }

  // Never create/modify the account here: the email must be verified first
  // (see lib/account-verification.ts). The reply is identical whether or not
  // the email already has an account, so it can't be used to enumerate users.
  const existing = await prisma.customer.findUnique({ where: { email } });
  if (!existing?.passwordHash) {
    const passwordHash = await bcrypt.hash(password, 10);
    const token = createVerificationToken(email, fullName, passwordHash);
    const link = `${getSiteUrl().replace(/\/$/, "")}/api/account/verify?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: email,
      subject: "Confirmez votre compte / Confirm your account",
      html: `<p>Bonjour ${escapeHtml(fullName)},</p>
<p>Cliquez sur ce lien pour confirmer votre courriel et activer votre compte (valide 1 heure) :<br/><a href="${link}">${link}</a></p>
<p>Hi ${escapeHtml(fullName)}, click the link above to confirm your email and activate your account (valid for 1 hour).</p>
<p>Si vous n'avez pas fait cette demande, ignorez ce courriel / If you didn't request this, ignore this email.</p>`,
    });
  }

  return {
    success:
      "Si ce courriel peut être utilisé, un lien de confirmation vient d'être envoyé. / If this email can be used, a confirmation link has been sent.",
  };
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
