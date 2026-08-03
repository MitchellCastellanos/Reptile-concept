import Link from "next/link";
import { buildAdminListHref } from "@/lib/admin-catalog-listing";

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const delta = 1;
  const pages: number[] = [];

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      pages.push(i);
    }
  }

  const result: (number | "ellipsis")[] = [];
  let last = 0;
  for (const page of pages) {
    if (last) {
      if (page - last === 2) result.push(last + 1);
      else if (page - last > 2) result.push("ellipsis");
    }
    result.push(page);
    last = page;
  }
  return result;
}

export function AdminPagination({
  basePath,
  params,
  currentPage,
  totalPages,
}: {
  basePath: string;
  params: Record<string, string | number | undefined>;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const linkClass = (disabled: boolean) =>
    `rounded border px-3 py-1.5 text-sm ${disabled ? "pointer-events-none opacity-40" : "hover:bg-black/5 dark:hover:bg-white/5"}`;

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      <Link
        href={buildAdminListHref(basePath, { ...params, page: currentPage - 1 })}
        aria-disabled={currentPage <= 1}
        className={linkClass(currentPage <= 1)}
      >
        Précédent
      </Link>

      {pageNumbers.map((page, idx) =>
        page === "ellipsis" ? (
          <span key={`e-${idx}`} className="px-1 text-sm text-black/50">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildAdminListHref(basePath, { ...params, page })}
            aria-current={page === currentPage ? "page" : undefined}
            className={`min-w-9 rounded border px-2 py-1.5 text-center text-sm ${
              page === currentPage ? "border-primary bg-primary text-white" : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {page}
          </Link>
        ),
      )}

      <Link
        href={buildAdminListHref(basePath, { ...params, page: currentPage + 1 })}
        aria-disabled={currentPage >= totalPages}
        className={linkClass(currentPage >= totalPages)}
      >
        Suivant
      </Link>
    </nav>
  );
}
