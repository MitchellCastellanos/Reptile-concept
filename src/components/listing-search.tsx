"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { getAnimalImageUrl, getProductImageUrl } from "@/lib/images";
import { LISTING_SEARCH_MIN_CHARS } from "@/lib/listing";

type ListingScope = "animals" | "products";

type Suggestion = {
  id: string;
  labelFr: string;
  labelEn: string;
  href: string;
  imageUrl: string | null;
  category: string;
};

export function ListingSearch({
  scope,
  category,
  stock,
}: {
  scope: ListingScope;
  category?: string;
  stock?: string;
}) {
  const t = useTranslations("Listing");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const applySearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      params.delete("page");
      const next = params.toString();
      router.push(next ? `${pathname}?${next}` : pathname);
      setOpen(false);
    },
    [pathname, router, searchParams],
  );

  const fetchSuggestions = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length < LISTING_SEARCH_MIN_CHARS) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const params = new URLSearchParams({
        q: trimmed,
        scope,
      });
      if (category) params.set("category", category);
      if (stock) params.set("stock", stock);

      fetch(`/api/listing-search?${params.toString()}`)
        .then((res) => res.json())
        .then((data: { results: Suggestion[] }) => {
          setSuggestions(data.results ?? []);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    },
    [category, scope, stock],
  );

  function handleChange(value: string) {
    setQuery(value);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    applySearch(query);
  }

  function suggestionImage(item: Suggestion) {
    if (scope === "animals") {
      return getAnimalImageUrl(item.category, item.imageUrl ? [{ url: item.imageUrl }] : []);
    }
    return item.imageUrl || getProductImageUrl(item.category);
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const showDropdown =
    open && query.trim().length >= LISTING_SEARCH_MIN_CHARS && (loading || suggestions.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => {
              if (query.trim().length >= LISTING_SEARCH_MIN_CHARS) {
                setOpen(true);
                fetchSuggestions(query);
              }
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? listboxId : undefined}
            aria-autocomplete="list"
            role="combobox"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-light"
        >
          {t("searchSubmit")}
        </button>
      </form>

      {showDropdown ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-border bg-card py-2 shadow-lg"
        >
          {loading ? (
            <li className="px-4 py-3 text-sm text-muted">{t("searchLoading")}</li>
          ) : suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">{t("searchNoSuggestions")}</li>
          ) : (
            suggestions.map((item) => {
              const label = locale === "en" ? item.labelEn : item.labelFr;
              return (
                <li key={item.id} role="option">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent-light"
                  >
                    <Image
                      src={suggestionImage(item)}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0 truncate font-medium">{label}</span>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
