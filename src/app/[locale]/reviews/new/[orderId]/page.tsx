import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { verifyReviewToken } from "@/lib/review-token";
import { submitReviewAction } from "./actions";

export default async function NewReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string; locale: string }>;
  searchParams: Promise<{ token?: string; submitted?: string }>;
}) {
  const { orderId, locale } = await params;
  const { token, submitted } = await searchParams;
  const t = await getTranslations("Reviews");

  if (!token || !verifyReviewToken(orderId, token)) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-4 px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">{t("formTitle")}</h1>
        <p className="text-muted">{t("formInvalid")}</p>
      </main>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { review: true },
  });
  if (!order) notFound();

  if (order.review) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-4 px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">{t("formTitle")}</h1>
        <p className="text-muted">{submitted ? t("thankYou") : t("alreadySubmitted")}</p>
      </main>
    );
  }

  const boundAction = submitReviewAction.bind(null, orderId);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">{t("formTitle")}</h1>
      <form action={boundAction} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="locale" value={locale} />
        <label className="flex flex-col gap-1 text-sm">
          {t("ratingLabel")}
          <select
            name="rating"
            defaultValue="5"
            className="rounded-lg border border-border bg-background px-3 py-2"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("commentLabel")}
          <textarea
            name="comment"
            required
            rows={4}
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="w-fit rounded-full bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-light"
        >
          {t("submit")}
        </button>
      </form>
    </main>
  );
}
