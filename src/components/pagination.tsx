import { Link } from "@/i18n/navigation";

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
      if (page - last === 2) {
        result.push(last + 1);
      } else if (page - last > 2) {
        result.push("ellipsis");
      }
    }
    result.push(page);
    last = page;
  }
  return result;
}

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  previousLabel,
  nextLabel,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  previousLabel: string;
  nextLabel: string;
}) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const arrowClass = (disabled: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium transition ${
      disabled
        ? "pointer-events-none border-border text-muted/40"
        : "border-border text-foreground hover:border-primary/50 hover:bg-accent-light"
    }`;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
      <Link href={buildHref(currentPage - 1)} aria-disabled={currentPage <= 1} className={arrowClass(currentPage <= 1)}>
        {previousLabel}
      </Link>

      {pageNumbers.map((page, idx) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${idx}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-sm font-medium transition ${
              page === currentPage
                ? "border-primary bg-primary text-white"
                : "border-border text-foreground hover:border-primary/50 hover:bg-accent-light"
            }`}
          >
            {page}
          </Link>
        ),
      )}

      <Link
        href={buildHref(currentPage + 1)}
        aria-disabled={currentPage >= totalPages}
        className={arrowClass(currentPage >= totalPages)}
      >
        {nextLabel}
      </Link>
    </nav>
  );
}
