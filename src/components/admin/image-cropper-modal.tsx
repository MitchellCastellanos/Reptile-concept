"use client";

import { useEffect, useRef, useState } from "react";

const ASPECT_OPTIONS: { label: string; value: number }[] = [
  { label: "Carré (1:1)", value: 1 },
  { label: "Paysage (4:3)", value: 4 / 3 },
];

type Offset = { x: number; y: number };

/** Lets the admin pan/zoom/crop a photo client-side before it's uploaded. */
export function ImageCropperModal({
  file,
  initialAspect = 1,
  onCancel,
  onSkip,
  onConfirm,
}: {
  file: File;
  initialAspect?: number;
  onCancel: () => void;
  onSkip: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [aspect, setAspect] = useState(initialAspect);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [imgError, setImgError] = useState(false);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setImgEl(img);
    };
    img.onerror = () => {
      if (!cancelled) setImgError(true);
    };
    img.src = url;
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    function measure() {
      if (frameRef.current) {
        const rect = frameRef.current.getBoundingClientRect();
        setFrameSize({ width: rect.width, height: rect.height });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [aspect]);

  const baseScale =
    imgEl && frameSize.width && frameSize.height
      ? Math.max(frameSize.width / imgEl.naturalWidth, frameSize.height / imgEl.naturalHeight)
      : 1;

  // Recenter and reset zoom whenever a new image finishes loading, the frame is
  // measured, or the aspect changes — adjusting state during render (rather than
  // in an effect) avoids an extra cascading render.
  const resetKey =
    imgEl && frameSize.width && frameSize.height ? `${imgEl.src}|${aspect}|${frameSize.width}|${frameSize.height}` : null;
  const [lastResetKey, setLastResetKey] = useState<string | null>(null);
  if (resetKey && resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    const dispW = imgEl!.naturalWidth * baseScale;
    const dispH = imgEl!.naturalHeight * baseScale;
    setZoom(1);
    setOffset({ x: (frameSize.width - dispW) / 2, y: (frameSize.height - dispH) / 2 });
  }

  function clamp(next: Offset, effectiveScale: number): Offset {
    if (!imgEl) return next;
    const dispW = imgEl.naturalWidth * effectiveScale;
    const dispH = imgEl.naturalHeight * effectiveScale;
    const minX = Math.min(0, frameSize.width - dispW);
    const minY = Math.min(0, frameSize.height - dispH);
    return {
      x: Math.max(minX, Math.min(0, next.x)),
      y: Math.max(minY, Math.min(0, next.y)),
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!imgEl) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const next = { x: dragState.current.originX + dx, y: dragState.current.originY + dy };
    setOffset(clamp(next, baseScale * zoom));
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  function handleZoomChange(newZoom: number) {
    const oldScale = baseScale * zoom;
    const newScale = baseScale * newZoom;
    const cx = frameSize.width / 2;
    const cy = frameSize.height / 2;
    const imgX = (cx - offset.x) / oldScale;
    const imgY = (cy - offset.y) / oldScale;
    setZoom(newZoom);
    setOffset(clamp({ x: cx - imgX * newScale, y: cy - imgY * newScale }, newScale));
  }

  function handleConfirm() {
    if (!imgEl || !frameSize.width || !frameSize.height) return;
    const effectiveScale = baseScale * zoom;
    const sx = -offset.x / effectiveScale;
    const sy = -offset.y / effectiveScale;
    const sWidth = frameSize.width / effectiveScale;
    const sHeight = frameSize.height / effectiveScale;
    const outW = 1200;
    const outH = Math.round(1200 / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imgEl, sx, sy, sWidth, sHeight, 0, 0, outW, outH);
    canvas.toBlob((blob) => blob && onConfirm(blob), "image/jpeg", 0.9);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recadrer la photo"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 py-8"
      onClick={onCancel}
    >
      <div
        className="mx-auto w-full max-w-sm rounded-lg border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recadrer la photo</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fermer"
            className="rounded px-1.5 text-lg leading-none text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          {ASPECT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setAspect(opt.value)}
              className={`rounded border px-2 py-1 text-xs font-medium ${
                aspect === opt.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-black/20 dark:border-white/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {imgError ? (
          <p className="mb-3 text-xs text-red-600 dark:text-red-400">
            Impossible d&apos;afficher cette image pour le recadrage (format non supporté par le
            navigateur). Vous pouvez tout de même la téléverser telle quelle.
          </p>
        ) : (
          <>
            <div
              ref={frameRef}
              className="relative mx-auto touch-none select-none overflow-hidden rounded border border-black/10 bg-black/5 dark:border-white/10"
              style={{ width: "100%", aspectRatio: String(aspect), cursor: imgEl ? "grab" : "default" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {imgEl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgEl.src}
                  alt=""
                  draggable={false}
                  className="absolute left-0 top-0 max-w-none"
                  style={{
                    width: imgEl.naturalWidth * baseScale * zoom,
                    height: imgEl.naturalHeight * baseScale * zoom,
                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                    transformOrigin: "top left",
                  }}
                />
              ) : (
                <p className="flex h-full items-center justify-center text-xs text-black/50 dark:text-white/50">
                  Chargement...
                </p>
              )}
            </div>

            <label className="mt-3 flex items-center gap-2 text-xs">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                disabled={!imgEl}
                onChange={(e) => handleZoomChange(Number(e.target.value))}
                className="flex-1"
              />
            </label>
            <p className="mt-1 text-xs text-black/50 dark:text-white/50">
              Glissez la photo pour la repositionner dans le cadre.
            </p>
          </>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-black/20 px-3 py-1.5 text-sm dark:border-white/20"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded border border-black/20 px-3 py-1.5 text-sm dark:border-white/20"
          >
            Téléverser sans recadrer
          </button>
          <button
            type="button"
            disabled={!imgEl || imgError}
            onClick={handleConfirm}
            className="rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
          >
            Recadrer et téléverser
          </button>
        </div>
      </div>
    </div>
  );
}
