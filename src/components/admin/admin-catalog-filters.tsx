import Link from "next/link";
import { buildAdminListHref } from "@/lib/admin-catalog-listing";
import { LISTING_PAGE_SIZES } from "@/lib/listing";

type FilterField =
  | { type: "search"; name: "q"; label: string; placeholder?: string }
  | {
      type: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
    };

export function AdminCatalogFilters({
  basePath,
  params,
  fields,
  resultCount,
}: {
  basePath: string;
  params: Record<string, string | number | undefined>;
  fields: FilterField[];
  resultCount: number;
}) {
  const resetHref = buildAdminListHref(basePath, { perPage: params.perPage });

  return (
    <form method="get" className="flex flex-col gap-3 rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
      <input type="hidden" name="sort" value={params.sort ?? "default"} />
      <input type="hidden" name="dir" value={params.dir ?? "asc"} />

      <div className="flex flex-wrap items-end gap-3">
        {fields.map((field) =>
          field.type === "search" ? (
            <label key={field.name} className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-medium">
              {field.label}
              <input
                type="search"
                name={field.name}
                defaultValue={String(params[field.name] ?? "")}
                placeholder={field.placeholder}
                className="rounded-lg border border-black/15 bg-background px-3 py-2 text-sm dark:border-white/15"
              />
            </label>
          ) : (
            <label key={field.name} className="flex flex-col gap-1 text-xs font-medium">
              {field.label}
              <select
                name={field.name}
                defaultValue={String(params[field.name] ?? "")}
                className="rounded-lg border border-black/15 bg-background px-3 py-2 text-sm dark:border-white/15"
              >
                {field.options.map((opt) => (
                  <option key={opt.value || "__all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          ),
        )}

        <label className="flex flex-col gap-1 text-xs font-medium">
          Par page
          <select
            name="perPage"
            defaultValue={String(params.perPage ?? 25)}
            className="rounded-lg border border-black/15 bg-background px-3 py-2 text-sm dark:border-white/15"
          >
            {LISTING_PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Filtrer
        </button>
        <Link
          href={resetHref}
          className="rounded-lg border border-black/15 px-4 py-2 text-sm dark:border-white/15"
        >
          Réinitialiser
        </Link>
      </div>

      <p className="text-xs text-black/60 dark:text-white/60">{resultCount} résultat(s)</p>
    </form>
  );
}
