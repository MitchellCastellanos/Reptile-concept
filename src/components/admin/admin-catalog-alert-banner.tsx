import type { CatalogAlertKind } from "@/lib/admin-catalog-attention";
import { CATALOG_ALERT_COPY } from "@/lib/admin-catalog-attention";

export function AdminCatalogAlertBanner({
  kind,
  count,
}: {
  kind: CatalogAlertKind;
  count: number;
}) {
  if (count <= 0) return null;

  const copy = CATALOG_ALERT_COPY[kind];

  return (
    <div className="rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-600/50 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-semibold">
        {copy.title} ({count})
      </p>
      <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">{copy.body}</p>
      <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-200/90">
        → {copy.action}
      </p>
    </div>
  );
}
