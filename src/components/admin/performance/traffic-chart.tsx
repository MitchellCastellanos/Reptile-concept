"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatDayLong, formatDayShort, formatNumber, niceScale } from "@/lib/analytics/format";

export type ChartPoint = { day: string; views: number; prevDay: string; prevViews: number };

const HEIGHT = 240;
const M = { top: 12, right: 14, bottom: 28, left: 40 };

export function TrafficChart({
  points,
  showPrevious,
  unit = "pages vues",
}: {
  points: ChartPoint[];
  showPrevious: boolean;
  unit?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const descId = useId();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(240, Math.round(el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Tapping/clicking outside the chart dismisses a pinned tooltip (touch).
  useEffect(() => {
    if (active === null) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [active]);

  const n = points.length;
  const innerW = width - M.left - M.right;
  const innerH = HEIGHT - M.top - M.bottom;
  const peak = Math.max(0, ...points.map((p) => p.views), ...(showPrevious ? points.map((p) => p.prevViews) : []));
  const { max, ticks } = niceScale(peak);
  const empty = points.every((p) => p.views === 0) && (!showPrevious || points.every((p) => p.prevViews === 0));

  const x = (i: number) => (n <= 1 ? M.left + innerW / 2 : M.left + (i * innerW) / (n - 1));
  const y = (v: number) => M.top + innerH - (v / max) * innerH;
  const line = (get: (p: ChartPoint) => number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(get(p)).toFixed(1)}`).join(" ");
  const baseY = M.top + innerH;
  const areaPath = n ? `${line((p) => p.views)} L${x(n - 1).toFixed(1)},${baseY} L${x(0).toFixed(1)},${baseY} Z` : "";

  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 72))));
  const xLabels = points
    .map((p, i) => ({ i, day: p.day }))
    .filter(({ i }) => (n - 1 - i) % labelEvery === 0);

  function indexFromClientX(clientX: number, target: SVGSVGElement) {
    const rect = target.getBoundingClientRect();
    const px = clientX - rect.left - M.left;
    if (n <= 1) return 0;
    return Math.min(n - 1, Math.max(0, Math.round((px / innerW) * (n - 1))));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!n) return;
    const cur = active ?? n - 1;
    let next: number | null = null;
    if (e.key === "ArrowLeft") next = Math.max(0, cur - 1);
    else if (e.key === "ArrowRight") next = Math.min(n - 1, cur + 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else if (e.key === "Escape") {
      setActive(null);
      return;
    }
    if (next !== null) {
      e.preventDefault();
      setActive(next);
    }
  }

  const a = active !== null ? points[active] : null;
  const total = points.reduce((s, p) => s + p.views, 0);
  const summary = `Graphique linéaire des ${unit} par jour, du ${formatDayLong(points[0]?.day ?? "")} au ${formatDayLong(
    points[n - 1]?.day ?? "",
  )} : ${formatNumber(total)} au total. Utilisez les flèches gauche et droite pour parcourir les jours.`;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded bg-primary" /> Période sélectionnée
        </span>
        {showPrevious ? (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="w-4 border-t-2 border-dashed border-muted" /> Période précédente
          </span>
        ) : null}
      </div>

      <div
        ref={wrapRef}
        className="relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        tabIndex={0}
        role="group"
        aria-roledescription="graphique"
        aria-label={summary}
        aria-describedby={descId}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((c) => c ?? n - 1)}
        onBlur={() => setActive(null)}
      >
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block max-w-full touch-pan-y select-none"
          aria-hidden="true"
          onPointerMove={(e) => setActive(indexFromClientX(e.clientX, e.currentTarget))}
          onPointerDown={(e) => setActive(indexFromClientX(e.clientX, e.currentTarget))}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setActive(null);
          }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
              <text x={M.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-muted text-[11px]">
                {formatNumber(t)}
              </text>
            </g>
          ))}
          {xLabels.map(({ i, day }) => (
            <text
              key={day}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor={i === n - 1 && n > 1 ? "end" : i === 0 && n > 1 ? "start" : "middle"}
              className="fill-muted text-[11px]"
            >
              {formatDayShort(day)}
            </text>
          ))}
          {n > 0 ? <path d={areaPath} className="fill-primary/10" /> : null}
          {showPrevious && n > 0 ? (
            <path d={line((p) => p.prevViews)} fill="none" className="stroke-muted" strokeWidth={1.5} strokeDasharray="4 4" />
          ) : null}
          {n > 0 ? (
            <path d={line((p) => p.views)} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" />
          ) : null}
          {n <= 31
            ? points.map((p, i) => <circle key={p.day} cx={x(i)} cy={y(p.views)} r={2.5} className="fill-primary" />)
            : null}
          {a && active !== null ? (
            <g>
              <line x1={x(active)} x2={x(active)} y1={M.top} y2={baseY} className="stroke-foreground/40" strokeWidth={1} />
              <circle cx={x(active)} cy={y(a.views)} r={5} className="fill-card stroke-primary" strokeWidth={2.5} />
            </g>
          ) : null}
        </svg>

        {empty ? (
          <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-muted">
            Aucune visite enregistrée pendant cette période.
          </p>
        ) : null}

        {a && active !== null ? (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-[220px] rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md"
            style={{
              top: M.top + 4,
              // Flip to the other side of the guide near the right edge so the tooltip never clips.
              ...(x(active) > width / 2
                ? { right: width - x(active) + 10 }
                : { left: x(active) + 10 }),
            }}
          >
            <p className="font-medium first-letter:uppercase">{formatDayLong(a.day)}</p>
            <p className="mt-1 flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
              {formatNumber(a.views)} {unit}
            </p>
            {showPrevious ? (
              <p className="mt-0.5 text-muted">
                {formatNumber(a.prevViews)} le {formatDayShort(a.prevDay)} (préc.)
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <p id={descId} className="sr-only" aria-live="polite">
        {a
          ? `${formatDayLong(a.day)} : ${formatNumber(a.views)} ${unit}`
          : "Sélectionnez un jour pour afficher le détail."}
      </p>

      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer select-none underline-offset-2 hover:underline">
          Afficher les données sous forme de tableau
        </summary>
        <div className="mt-2 max-h-60 overflow-auto">
          <table className="w-full max-w-sm border-collapse">
            <caption className="sr-only">Pages vues par jour</caption>
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-1 font-medium">Jour</th>
                <th scope="col" className="py-1 text-right font-medium">Pages vues</th>
                {showPrevious ? <th scope="col" className="py-1 text-right font-medium">Période préc.</th> : null}
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.day} className="border-b border-border/60">
                  <th scope="row" className="py-1 text-left font-normal">{p.day}</th>
                  <td className="py-1 text-right tabular-nums">{formatNumber(p.views)}</td>
                  {showPrevious ? <td className="py-1 text-right tabular-nums">{formatNumber(p.prevViews)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
