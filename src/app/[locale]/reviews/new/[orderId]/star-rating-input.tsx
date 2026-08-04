"use client";

import { useState } from "react";

export function StarRatingInput({ name, defaultValue = 5 }: { name: string; defaultValue?: number }) {
  const [rating, setRating] = useState(defaultValue);
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? rating;

  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={rating} />
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
  );
}
