"use client";

import { useState } from "react";
import { PhotoUploadField } from "./photo-upload-field";

/** Repeatable list of extra gallery photo URLs, serialized to a single hidden JSON input on submit. */
export function GalleryUrlsField({ name, initialUrls }: { name: string; initialUrls: string[] }) {
  const [urls, setUrls] = useState<string[]>(initialUrls);

  function updateAt(index: number, url: string) {
    setUrls((prev) => prev.map((u, i) => (i === index ? url : u)));
  }

  function removeAt(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-black/10 p-3 dark:border-white/10">
      <p className="text-sm font-medium">Photos additionnelles (galerie)</p>
      {urls.map((url, i) => (
        <div key={i} className="flex flex-col gap-1">
          <PhotoUploadField
            name={`__gallery-${i}`}
            label={`Photo ${i + 2}`}
            value={url}
            onChange={(v) => updateAt(i, v)}
            placeholder="https://…"
          />
          <button
            type="button"
            onClick={() => removeAt(i)}
            className="w-fit text-xs text-red-600 hover:underline dark:text-red-400"
          >
            Retirer
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setUrls((prev) => [...prev, ""])}
        className="w-fit rounded border border-black/20 px-3 py-1.5 text-xs font-medium dark:border-white/20"
      >
        + Ajouter une photo
      </button>
      <input type="hidden" name={name} value={JSON.stringify(urls.map((u) => u.trim()).filter(Boolean))} />
    </div>
  );
}
