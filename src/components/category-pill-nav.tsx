"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";

export type CategoryPillItem = {
  value: string;
  label: string;
};

export function CategoryPillNav({
  items,
  activeValue,
  allLabel,
}: {
  items: CategoryPillItem[];
  activeValue?: string;
  allLabel: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function updateFades() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }

    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);
    return () => {
      el.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
    };
  }, [items]);

  function hrefFor(value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const pillClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
      active
        ? "border-primary bg-primary text-white shadow-sm"
        : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent-light"
    }`;

  return (
    <div className="relative -mx-6">
      <div
        ref={scrollRef}
        className="flex snap-x snap-proximity gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:thin]"
      >
        <Link href={hrefFor(undefined)} className={`snap-start ${pillClass(!activeValue)}`}>
          {allLabel}
        </Link>
        {items.map((item) => (
          <Link
            key={item.value}
            href={hrefFor(item.value)}
            className={`snap-start ${pillClass(activeValue === item.value)}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent transition-opacity duration-200 ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background via-background/80 to-transparent transition-opacity duration-200 ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
