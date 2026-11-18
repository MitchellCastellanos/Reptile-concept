"use client";

export default function PerformanceError({ unstable_retry }: { error: Error; unstable_retry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
      <h1 className="text-lg font-semibold">Impossible de charger les statistiques</h1>
      <p className="text-sm">
        Une erreur est survenue lors de la lecture des données. Aucune donnée n&apos;a été modifiée.
      </p>
      <button type="button" onClick={() => unstable_retry()} className="rounded-md border border-red-400 bg-white px-3 py-1.5 text-sm hover:bg-red-100">
        Réessayer
      </button>
    </div>
  );
}
