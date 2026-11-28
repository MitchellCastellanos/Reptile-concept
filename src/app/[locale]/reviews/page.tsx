import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { RatingStars } from "@/components/rating-stars";
import { VerifiedPurchaseBadge } from "@/components/verified-purchase-badge";
import { formatReviewerName } from "@/lib/review-display";
import type { Metadata } from "next";
import { getTranslations as getMetaTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getMetaTranslations({ locale, namespace: "Reviews" });
  return buildPageMetadata({ locale, path: "/reviews", title: t("title"), description: t("subtitle") });
}

export default async function ReviewsPage() {
  const t = await getTranslations("Reviews");
  const lang = (await getLocale()) === "en" ? "en" : "fr";
  const reviews = await prisma.review.findMany({
    where: { published: true },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </div>

      {reviews.length === 0 ? (
        <p className="text-muted">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <RatingStars rating={review.rating} />
                {/* Reviews can only be created from a picked-up order, so every one is a verified purchase. */}
                <VerifiedPurchaseBadge label={t("verifiedPurchase")} />
              </div>
              {review.comment ? (
                <p className="text-sm leading-relaxed text-foreground">{review.comment}</p>
              ) : null}
              <p className="mt-auto pt-2 text-xs font-medium uppercase tracking-wide text-muted">
                {formatReviewerName(review.customer.fullName, review.nameDisplay, lang)}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
