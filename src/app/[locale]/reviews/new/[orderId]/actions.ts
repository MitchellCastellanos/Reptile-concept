"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyReviewToken } from "@/lib/review-token";

type ItemRatingInput = { type?: string; id?: string; rating?: number };

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

  // Trust nothing from the client beyond "which items got which stars" —
  // cross-check every entry actually belongs to this order before saving it.
  let rawItemRatings: ItemRatingInput[] = [];
  try {
    rawItemRatings = JSON.parse(String(formData.get("itemRatingsJson") ?? "[]"));
  } catch {
    rawItemRatings = [];
  }

  const itemRatings = rawItemRatings
    .filter((entry): entry is Required<ItemRatingInput> => {
      if (!entry.id || !entry.type || !entry.rating) return false;
      if (entry.type === "animal") return order.items.some((item) => item.animalId === entry.id);
      if (entry.type === "product") return order.items.some((item) => item.productId === entry.id);
      return false;
    })
    .map((entry) => ({
      rating: Math.min(5, Math.max(1, Number(entry.rating) || rating)),
      animalId: entry.type === "animal" ? entry.id : undefined,
      productId: entry.type === "product" ? entry.id : undefined,
    }));

  await prisma.review.create({
    data: {
      orderId,
      customerId: order.customerId,
      rating,
      comment,
      itemRatings: itemRatings.length > 0 ? { create: itemRatings } : undefined,
    },
  });

  redirect(`/${locale}/reviews/new/${orderId}?token=${token}&submitted=1`);
}
