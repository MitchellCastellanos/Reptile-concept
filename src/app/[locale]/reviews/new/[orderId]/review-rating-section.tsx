"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type ReviewableItem = { type: "animal" | "product"; id: string; label: string };

export function ReviewRatingSection({ items }: { items: ReviewableItem[] }) {
  const t = useTranslations("Reviews");
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState<number | null>(null);
  const [targetKey, setTargetKey] = useState("");
  const shown = hovered ?? rating;

  // Only worth asking when there's more than one item to disambiguate, and
  // only when the rating is low enough that attributing it to everything in
  // the order could unfairly ding an otherwise-fine item.
  const showPicker = rating <= 3 && items.length > 1;
  const [targetType, targetId] = targetKey ? targetKey.split(":") : ["", ""];

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="rating" value={rating} />
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            aria-label={`${n} / 5`}
            className="p-0.5 text-3xl leading-none text-accent transition-transform hover:scale-110"
          >
            {n <= shown ? "★" : "☆"}
          </button>
        ))}
      </div>

      {showPicker ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-accent-light p-3 text-sm">
          <p className="font-medium text-foreground">{t("targetPrompt")}</p>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="targetChoice"
              checked={targetKey === ""}
              onChange={() => setTargetKey("")}
            />
            {t("targetWholeOrder")}
          </label>
          {items.map((item) => (
            <label key={`${item.type}-${item.id}`} className="flex items-center gap-2">
              <input
                type="radio"
                name="targetChoice"
                checked={targetKey === `${item.type}:${item.id}`}
                onChange={() => setTargetKey(`${item.type}:${item.id}`)}
              />
              {item.label}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
