import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readVerificationToken } from "@/lib/account-verification";
import { createCustomerSession } from "@/lib/customer-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const data = readVerificationToken(url.searchParams.get("token") ?? "");
  if (!data) {
    return NextResponse.redirect(new URL("/account/register?verify=invalid", url));
  }

  const existing = await prisma.customer.findUnique({ where: { email: data.email } });
  if (existing?.passwordHash) {
    // Link already used (or an account was created meanwhile): never overwrite.
    return NextResponse.redirect(new URL("/account/login", url));
  }

  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data: { passwordHash: data.passwordHash, fullName: data.fullName },
      })
    : await prisma.customer.create({
        data: { fullName: data.fullName, email: data.email, passwordHash: data.passwordHash, ageVerified: true },
      });

  await createCustomerSession(customer.id);
  return NextResponse.redirect(new URL("/account", url));
}
