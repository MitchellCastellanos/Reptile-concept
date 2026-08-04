"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function SearchForm({ initialQuery }: { initialQuery: string }) {
  const t = useTranslations("Search");
  const router = useRouter();
  const pathname = usePathname();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = new FormData(e.currentTarget).get("q");
    const value = String(query ?? "").trim();
    router.push(value ? `${pathname}?q=${encodeURIComponent(value)}` : pathname);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={initialQuery}
        placeholder={t("placeholder")}
        className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        autoFocus
      />
      <button
        type="submit"
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-light"
      >
        {t("submit")}
      </button>
    </form>
  );
}
