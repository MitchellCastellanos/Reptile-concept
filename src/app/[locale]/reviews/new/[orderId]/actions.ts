"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyReviewToken } from "@/lib/review-token";

export async function submitReviewAction(orderId: string, formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!verifyReviewToken(orderId, token)) {
    throw new Error("Invalid review token");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status !== "picked_up") {
    throw new Error("This order is not eligible for a review yet");
  }

  const existing = await prisma.review.findUnique({ where: { orderId } });
  if (existing) {
    throw new Error("A review already exists for this order");
  }

  const rating = Math.min(5, Math.max(1, Number(formData.get("rating")) || 5));
  const comment = String(formData.get("comment") ?? "").trim() || null;
  const locale = String(formData.get("locale") ?? "fr");

  // Trust nothing from the client beyond "which item" — cross-check the
  // chosen target actually belongs to this order before tagging the review.
  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  let animalId: string | null = null;
  let productId: string | null = null;
  if (targetType === "animal" && order.items.some((item) => item.animalId === targetId)) {
    animalId = targetId;
  } else if (targetType === "product" && order.items.some((item) => item.productId === targetId)) {
    productId = targetId;
  }

  await prisma.review.create({
    data: { orderId, customerId: order.customerId, rating, comment, animalId, productId },
  });

  redirect(`/${locale}/reviews/new/${orderId}?token=${token}&submitted=1`);
}
