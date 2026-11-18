"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/analytics/format";

export type PathRowData = { path: string; views: number; share: number };
type SortKey = "views" | "path";

export function TopPagesTable({ rows }: { rows: PathRowData[] }) {
  const [key, setKey] = useState<SortKey>("views");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const factor = dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) =>
      key === "views" ? (a.views - b.views) * factor || a.path.localeCompare(b.path) : a.path.localeCompare(b.path) * factor,
    );
  }, [rows, key, dir]);

  if (rows.length === 0) {
    return <p className="py-3 text-sm text-muted">Aucune visite enregistrée pour ces filtres.</p>;
  }

  const max = Math.max(...rows.map((r) => r.views));
  const toggle = (k: SortKey) => {
    if (k === key) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setKey(k);
      setDir(k === "views" ? "desc" : "asc");
    }
  };
  const ariaSort = (k: SortKey) => (k === key ? (dir === "asc" ? "ascending" : "descending") : "none");
  const arrow = (k: SortKey) => (k === key ? (dir === "asc" ? " ↑" : " ↓") : "");

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th scope="col" aria-sort={ariaSort("path")} className="py-2 pr-3 font-medium">
              <button type="button" onClick={() => toggle("path")} className="font-medium hover:underline">
                Page{arrow("path")}
              </button>
            </th>
            <th scope="col" aria-sort={ariaSort("views")} className="w-24 py-2 text-right font-medium">
              <button type="button" onClick={() => toggle("views")} className="font-medium hover:underline">
                Pages vues{arrow("views")}
              </button>
            </th>
            <th scope="col" className="w-20 py-2 text-right font-medium">Part</th>
            <th scope="col" className="hidden w-40 py-2 pl-4 font-medium sm:table-cell">
              <span className="sr-only">Proportion</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.path} className="border-b border-border/60">
              <td className="max-w-[16rem] break-all py-2 pr-3 font-mono text-xs sm:max-w-none">{r.path}</td>
              <td className="py-2 text-right font-medium tabular-nums">{formatNumber(r.views)}</td>
              <td className="py-2 text-right tabular-nums text-muted">{(r.share * 100).toFixed(1)} %</td>
              <td className="hidden py-2 pl-4 sm:table-cell" aria-hidden="true">
                <div className="h-2 w-full rounded-full bg-border/60">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${(r.views / max) * 100}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
