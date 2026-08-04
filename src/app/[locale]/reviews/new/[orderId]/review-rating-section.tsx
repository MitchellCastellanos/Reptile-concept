"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type ReviewableItem = { type: "animal" | "product"; id: string; label: string };

const VISIBLE_COUNT = 4;

function StarRow({
  value,
  onChange,
  size,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  size: string;
  label: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          aria-label={`${label} — ${n} / 5`}
          className={`p-0.5 leading-none text-accent transition-transform hover:scale-110 ${size}`}
        >
          {n <= shown ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

export function ReviewRatingSection({ items }: { items: ReviewableItem[] }) {
  const t = useTranslations("Reviews");
  const [rating, setRating] = useState(5);
  const [itemOverrides, setItemOverrides] = useState<Record<string, number>>({});
  const [showAll, setShowAll] = useState(false);

  // Only worth breaking down when there's more than one item to tell apart,
  // and only once the overall rating is low enough that one bad item
  // dragging every item in the order down together would actually matter.
  const showBreakdown = rating <= 3 && items.length > 1;
  const visibleItems = showAll ? items : items.slice(0, VISIBLE_COUNT);
  const hiddenCount = items.length - visibleItems.length;

  function keyFor(item: ReviewableItem) {
    return `${item.type}:${item.id}`;
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="rating" value={rating} />
      {showBreakdown ? (
        <input
          type="hidden"
          name="itemRatingsJson"
          value={JSON.stringify(
            visibleItems.map((item) => ({
              type: item.type,
              id: item.id,
              rating: itemOverrides[keyFor(item)] ?? rating,
            })),
          )}
        />
      ) : null}

      <StarRow value={rating} onChange={setRating} size="text-3xl" label={t("ratingLabel")} />

      {showBreakdown ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-accent-light p-3">
          <p className="text-sm font-medium text-foreground">{t("itemRatingsPrompt")}</p>
          {visibleItems.map((item) => {
            const key = keyFor(item);
            const value = itemOverrides[key] ?? rating;
            return (
              <div key={key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{item.label}</span>
                <StarRow
                  value={value}
                  onChange={(n) => setItemOverrides((prev) => ({ ...prev, [key]: n }))}
                  size="text-lg"
                  label={item.label}
                />
              </div>
            );
          })}
          {!showAll && hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-fit text-xs font-medium text-primary hover:underline"
            >
              {t("showMoreItems", { count: hiddenCount })}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
