"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { createVerificationToken, readVerificationToken } from "@/lib/account-verification";
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

  if (!fullName || !email || !email.includes("@") || fullName.length > 100 || email.length > 254) {
    return { error: "Nom et courriel valides requis." };
  }

  // Never create/modify anything here: the email must be verified first and the
  // password is chosen only after following the emailed link (see
  // lib/account-verification.ts). The email is sent after the response so
  // timing doesn't reveal whether the address already has an account.
  const existing = await prisma.customer.findUnique({ where: { email }, select: { passwordHash: true } });
  if (!existing?.passwordHash) {
    const token = createVerificationToken(email, fullName);
    const link = `${getSiteUrl().replace(/\/$/, "")}/account/verify?token=${encodeURIComponent(token)}`;
    after(() =>
      sendEmail({
        to: email,
        subject: "Confirmez votre compte / Confirm your account",
        html: `<p>Bonjour ${escapeHtml(fullName)},</p>
<p>Cliquez sur ce lien pour confirmer votre courriel et choisir votre mot de passe (valide 1 heure) :<br/><a href="${link}">${link}</a></p>
<p>Hi ${escapeHtml(fullName)}, click the link above to confirm your email and choose your password (valid for 1 hour).</p>
<p>Si vous n'avez pas fait cette demande, ignorez ce courriel / If you didn't request this, ignore this email.</p>`,
      }).catch((err) => console.error("[account] verification email failed:", err)),
    );
  }

  return {
    success:
      "Si ce courriel peut être utilisé, un lien de confirmation vient d'être envoyé. / If this email can be used, a confirmation link has been sent.",
  };
}

export async function completeRegistrationAction(
  token: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const data = readVerificationToken(token);
  if (!data) {
    return { error: "Lien invalide ou expiré. Recommencez l'inscription. / Invalid or expired link." };
  }
  const password = String(formData.get("password") ?? "");
  if (password.length < 8 || password.length > 200) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères. / Password must be at least 8 characters." };
  }

  const existing = await prisma.customer.findUnique({ where: { email: data.email } });
  if (existing?.passwordHash) {
    return { error: "Un compte existe déjà avec ce courriel. Connectez-vous. / An account already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const customer = existing
    ? await prisma.customer.update({ where: { id: existing.id }, data: { passwordHash, fullName: data.fullName } })
    : await prisma.customer.create({
        data: { fullName: data.fullName, email: data.email, passwordHash, ageVerified: true },
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
