"use client";

import { useState } from "react";

export function PhotoUploadField({
  name,
  label,
  value,
  onChange,
  placeholder,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec du téléversement.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Échec du téléversement.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
        <label className="w-fit cursor-pointer rounded border border-black/20 px-3 py-2 text-xs font-medium dark:border-white/20">
          {uploading ? "Téléversement..." : "Parcourir..."}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      </div>
      {error ? <span className="text-xs text-red-600 dark:text-red-400">{error}</span> : null}
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="mt-2 h-32 w-32 rounded object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
          onLoad={(e) => (e.currentTarget.style.display = "block")}
        />
      ) : null}
    </label>
  );
}
