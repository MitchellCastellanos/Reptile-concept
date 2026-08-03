import Link from "next/link";
import { buildAdminListHref, toggleSortDir, type SortDir } from "@/lib/admin-catalog-listing";

export function AdminSortableTh({
  label,
  sortKey,
  currentSort,
  currentDir,
  basePath,
  params,
  className,
}: {
  label: string;
  sortKey: string;
  currentSort: string;
  currentDir: SortDir;
  basePath: string;
  params: Record<string, string | number | undefined>;
  className?: string;
}) {
  const active = currentSort === sortKey;
  const nextDir = toggleSortDir(currentSort, sortKey, currentDir);
  const href = buildAdminListHref(basePath, {
    ...params,
    sort: sortKey,
    dir: nextDir,
    page: 1,
  });

  return (
    <th className={className ?? "py-2 pr-3"}>
      <Link
        href={href}
        className={`inline-flex items-center gap-1 hover:underline ${active ? "font-semibold text-primary" : ""}`}
      >
        {label}
        <span className="text-[10px] text-black/50 dark:text-white/50" aria-hidden>
          {active ? (currentDir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </Link>
    </th>
  );
}
