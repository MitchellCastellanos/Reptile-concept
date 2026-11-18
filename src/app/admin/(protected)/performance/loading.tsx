export default function PerformanceLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Chargement des statistiques…</span>
      <div className="h-8 w-64 animate-pulse rounded bg-border/60" />
      <div className="h-28 animate-pulse rounded-lg bg-border/40" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-border/40" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-border/40" />
    </div>
  );
}
