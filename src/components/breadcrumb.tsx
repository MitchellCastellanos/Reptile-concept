import { Link } from "@/i18n/navigation";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link href={item.href} className="text-muted hover:text-primary hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-foreground" : "text-muted"}>{item.label}</span>
            )}
            {!isLast ? (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-muted/60" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}
