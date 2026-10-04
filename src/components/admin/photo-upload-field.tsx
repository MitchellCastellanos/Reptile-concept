"use client";

import { useRef, useState } from "react";
import { ImageCropperModal } from "./image-cropper-modal";

const CLIENT_MAX_BYTES = 3 * 1024 * 1024;
const CLIENT_MAX_DIMENSION = 1600;

/** Shrinks big phone photos in the browser so they fit Vercel's 4.5 MB request limit. */
async function downscaleIfLarge(file: File): Promise<File> {
  if (file.size <= CLIENT_MAX_BYTES || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, CLIENT_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function PhotoUploadField({
  name,
  label,
  value,
  onChange,
  placeholder,
  aspect = 1,
  onUploadingChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  /** Default crop aspect ratio (width / height) offered in the cropper. */
  aspect?: number;
  /** Fires true when a real upload request starts and false when it settles (success or failure). */
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  // Synchronous guard: `uploading` state only updates on the next render, so
  // two calls in the same tick would both pass a state check and create two blobs.
  const inFlightRef = useRef(false);

  async function uploadFile(original: File) {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setUploading(true);
    onUploadingChange?.(true);
    setError(null);
    try {
      const file = await downscaleIfLarge(original);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Échec du téléversement.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Échec du téléversement.");
    } finally {
      inFlightRef.current = false;
      setUploading(false);
      onUploadingChange?.(false);
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
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) setPendingFile(file);
            }}
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

      {pendingFile ? (
        <ImageCropperModal
          file={pendingFile}
          initialAspect={aspect}
          onCancel={() => setPendingFile(null)}
          onSkip={() => {
            const file = pendingFile;
            setPendingFile(null);
            uploadFile(file);
          }}
          onConfirm={(blob) => {
            const cropped = new File([blob], pendingFile.name.replace(/\.\w+$/, ".jpg"), {
              type: "image/jpeg",
            });
            setPendingFile(null);
            uploadFile(cropped);
          }}
        />
      ) : null}
    </label>
  );
}
