import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-accent" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < rating ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  const t = await getTranslations("Reviews");
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
              <Stars rating={review.rating} />
              <p className="text-sm leading-relaxed text-foreground">{review.comment}</p>
              <p className="mt-auto pt-2 text-xs font-medium uppercase tracking-wide text-muted">
                {review.customer.fullName}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
