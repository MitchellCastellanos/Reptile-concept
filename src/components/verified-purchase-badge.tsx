/** "Verified purchase" shield badge — shown on reviews tied to a real, picked-up order. */
export function VerifiedPurchaseBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
        <path d="M12 1.5 3.5 4.8v6.4c0 5.1 3.5 9.8 8.5 11.3 5-1.5 8.5-6.2 8.5-11.3V4.8L12 1.5Zm-1.2 14.7-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3Z" />
      </svg>
      {label}
    </span>
  );
}
