"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { PhotoUploadField } from "./photo-upload-field";

export function AdminPhotoCell({
  id,
  currentUrl,
  defaultUrl,
  action,
}: {
  id: string;
  currentUrl: string | null;
  defaultUrl: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(currentUrl ?? "");
  const [pending, startTransition] = useTransition();
  const hasOwnPhoto = Boolean(currentUrl);

  function openModal() {
    setPhotoUrl(currentUrl ?? "");
    setOpen(true);
  }

  function handleSave() {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("photoUrl", photoUrl);
    startTransition(async () => {
      await action(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="relative block h-12 w-12"
        title={hasOwnPhoto ? "Photo personnalisée" : "Photo par défaut (catégorie)"}
      >
        <Image
          src={currentUrl || defaultUrl}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded object-cover"
        />
        <span
          className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white text-[9px] leading-none dark:border-black ${
            hasOwnPhoto ? "bg-green-600 text-white" : "bg-zinc-400 text-white"
          }`}
        >
          {hasOwnPhoto ? "✓" : "D"}
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Photo</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="rounded px-1.5 text-lg leading-none text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
              >
                ×
              </button>
            </div>

            <p className="mb-3 text-xs text-black/60 dark:text-white/60">
              {photoUrl
                ? "Photo personnalisée."
                : "Aucune photo personnalisée — la photo par défaut de la catégorie (ci-dessous) est utilisée."}
            </p>

            {!photoUrl ? (
              <div className="mb-3 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={defaultUrl} alt="" className="h-16 w-16 rounded object-cover" />
                <span className="text-xs text-black/60 dark:text-white/60">Photo par défaut</span>
              </div>
            ) : null}

            <PhotoUploadField
              name="photoUrl"
              label="Photo personnalisée"
              value={photoUrl}
              onChange={setPhotoUrl}
              placeholder="https://…"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-black/20 px-3 py-1.5 text-sm dark:border-white/20"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleSave}
                className="rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
              >
                {pending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
