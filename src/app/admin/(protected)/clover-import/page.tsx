import Link from "next/link";
import { prisma } from "@/lib/db";
import { ignoreCloverImportCandidateAction, deleteCategoryRuleAction } from "./actions";
import { FullImportButton } from "./full-import-button";
import { CategoryBulkActions } from "./category-bulk-actions";
import { listCloverCategoryRules } from "@/lib/clover-sync";

const PAGE_SIZE = 50;

export default async function CloverImportPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  // "__none__" stands in for a null Clover category (items with no category
  // set); undefined means "no filter applied, show everything".
  const categoryFilter = params.category;
  const page = Math.max(1, Number(params.page) || 1);

  const [grouped, candidates, totalPending, rules] = await Promise.all([
    prisma.cloverImportCandidate.groupBy({
      by: ["cloverCategoryName"],
      where: { status: "pending" },
      _count: { _all: true },
    }),
    prisma.cloverImportCandidate.findMany({
      where: {
        status: "pending",
        ...(categoryFilter !== undefined
          ? { cloverCategoryName: categoryFilter === "__none__" ? null : categoryFilter }
          : {}),
      },
      orderBy: { firstSeenAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.cloverImportCandidate.count({ where: { status: "pending" } }),
    listCloverCategoryRules(),
  ]);

  const categories = grouped
    .map((g) => ({ name: g.cloverCategoryName, count: g._count._all }))
    .sort((a, b) => b.count - a.count);
  const ruleByCategory = new Map(rules.map((r) => [r.cloverCategoryName, r]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Nouveaux articles Clover</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Articles capturés directement sur l&apos;appareil Clover (comptoir ou salon) qui n&apos;ont
          pas encore de fiche sur le site — {totalPending} en attente au total. Pour un gros catalogue,
          traitez-les par catégorie Clover ci-dessous plutôt qu&apos;un par un.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
        <FullImportButton />
      </div>

      {categories.length > 0 ? (
        <div className="overflow-x-auto">
          <h2 className="mb-2 text-lg font-medium">Par catégorie Clover</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left dark:border-white/10">
                <th className="py-2">Catégorie Clover</th>
                <th className="py-2 text-right">En attente</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(({ name, count }) => {
                const key = name ?? "__none__";
                const isActive = categoryFilter === key;
                const rule = ruleByCategory.get(name ?? "");
                return (
                  <tr key={key} className="border-b border-black/5 dark:border-white/5">
                    <td className="py-2">
                      <Link
                        href={`/admin/clover-import?category=${encodeURIComponent(key)}`}
                        className={isActive ? "font-medium underline" : "underline"}
                      >
                        {name ?? "Sans catégorie"}
                      </Link>
                      {rule ? (
                        <span className="ml-2 rounded bg-black/5 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-white/10 dark:text-zinc-400">
                          {rule.action === "auto_product" ? `auto → ${rule.productCategory}` : "auto-ignoré"}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 text-right">{count}</td>
                    <td className="py-2">
                      <CategoryBulkActions cloverCategoryName={name} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Rien en attente — tous les articles Clover sont déjà reliés à une fiche du site ou ignorés.
        </p>
      )}

      {rules.length > 0 ? (
        <div className="overflow-x-auto">
          <h2 className="mb-2 text-lg font-medium">Règles enregistrées</h2>
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            Appliquées automatiquement à chaque nouvel article Clover, sans passer par la file
            ci-dessus.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left dark:border-white/10">
                <th className="py-2">Catégorie Clover</th>
                <th className="py-2">Règle</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.cloverCategoryName} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2">{rule.cloverCategoryName || "Sans catégorie"}</td>
                  <td className="py-2">
                    {rule.action === "auto_product" ? `Créer comme produit — ${rule.productCategory}` : "Ignorer automatiquement"}
                  </td>
                  <td className="py-2">
                    <form action={deleteCategoryRuleAction}>
                      <input
                        type="hidden"
                        name="cloverCategoryName"
                        value={rule.cloverCategoryName || "__none__"}
                      />
                      <button type="submit" className="text-zinc-500 underline">
                        Supprimer
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {candidates.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-medium">
              Détail {categoryFilter !== undefined ? `— ${categoryFilter === "__none__" ? "sans catégorie" : categoryFilter}` : ""}
            </h2>
            {categoryFilter !== undefined ? (
              <Link href="/admin/clover-import" className="text-sm underline">
                Voir toutes les catégories
              </Link>
            ) : null}
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left dark:border-white/10">
                <th className="py-2">Nom (Clover)</th>
                <th className="py-2">Catégorie</th>
                <th className="py-2 text-right">Prix</th>
                <th className="py-2 text-right">Stock</th>
                <th className="py-2">Capté le</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => {
                const linkParams = new URLSearchParams({
                  cloverItemId: candidate.cloverItemId,
                  cloverName: candidate.name,
                  priceCAD: String(candidate.priceCAD),
                });
                return (
                  <tr key={candidate.id} className="border-b border-black/5 dark:border-white/5">
                    <td className="py-2">{candidate.name}</td>
                    <td className="py-2">{candidate.cloverCategoryName ?? "—"}</td>
                    <td className="py-2 text-right">{Number(candidate.priceCAD).toFixed(2)} $</td>
                    <td className="py-2 text-right">{candidate.stockCount ?? "—"}</td>
                    <td className="py-2">{candidate.firstSeenAt.toLocaleDateString("fr-CA")}</td>
                    <td className="flex flex-wrap gap-3 py-2">
                      <Link href={`/admin/animals/new?${linkParams.toString()}`} className="underline">
                        Créer un animal
                      </Link>
                      <Link href={`/admin/products/new?${linkParams.toString()}`} className="underline">
                        Créer un produit
                      </Link>
                      <form action={ignoreCloverImportCandidateAction}>
                        <input type="hidden" name="id" value={candidate.id} />
                        <button type="submit" className="text-zinc-500 underline">
                          Ignorer
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-3 flex items-center gap-4 text-sm">
            {page > 1 ? (
              <Link
                href={`/admin/clover-import?${new URLSearchParams({
                  ...(categoryFilter !== undefined ? { category: categoryFilter } : {}),
                  page: String(page - 1),
                }).toString()}`}
                className="underline"
              >
                ← Précédent
              </Link>
            ) : null}
            <span className="text-zinc-500">Page {page}</span>
            {candidates.length === PAGE_SIZE ? (
              <Link
                href={`/admin/clover-import?${new URLSearchParams({
                  ...(categoryFilter !== undefined ? { category: categoryFilter } : {}),
                  page: String(page + 1),
                }).toString()}`}
                className="underline"
              >
                Suivant →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
