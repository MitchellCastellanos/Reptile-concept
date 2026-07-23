import { prisma } from "@/lib/db";
import { togglePublishReviewAction, deleteReviewAction } from "./actions";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: { customer: true, order: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Avis clients</h1>

      <ul className="flex flex-col gap-4">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-lg border border-black/10 p-4 dark:border-white/10">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {review.customer.fullName} — {review.rating}/5
              </p>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Commande #{review.orderId.slice(0, 8)}
              </span>
            </div>
            <p className="mt-2 text-sm">{review.comment}</p>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <form action={togglePublishReviewAction}>
                <input type="hidden" name="id" value={review.id} />
                <input type="hidden" name="published" value={String(review.published)} />
                <button type="submit" className="underline">
                  {review.published ? "Retirer de la page publique" : "Publier"}
                </button>
              </form>
              <form action={deleteReviewAction}>
                <input type="hidden" name="id" value={review.id} />
                <button type="submit" className="text-red-600 underline">
                  Supprimer
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      {reviews.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Aucun avis pour le moment.</p>
      ) : null}
    </div>
  );
}
