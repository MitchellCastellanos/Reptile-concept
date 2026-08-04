const STAR = "★";
const STAR_EMPTY = "☆";

/** Read-only star rating, used both for a single review (integer rating) and an average (fractional). */
export function RatingStars({
  rating,
  count,
  size = "sm",
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const rounded = Math.round(rating);
  const textSize = size === "md" ? "text-base" : "text-sm";

  return (
    <div className="flex items-center gap-1.5" aria-label={`${rating.toFixed(1)}/5`}>
      <div className={`flex gap-0.5 text-accent ${textSize}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} aria-hidden>
            {i < rounded ? STAR : STAR_EMPTY}
          </span>
        ))}
      </div>
      {count !== undefined ? (
        <span className="text-xs text-muted">
          {rating.toFixed(1)} ({count})
        </span>
      ) : null}
    </div>
  );
}
