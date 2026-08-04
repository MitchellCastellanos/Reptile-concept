import { CardGridSkeleton } from "@/components/card-grid-skeleton";

export default function BoutiqueLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-3">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-9 w-64 rounded" />
        <div className="skeleton h-4 w-96 max-w-full rounded" />
      </div>
      <CardGridSkeleton count={9} />
    </main>
  );
}
