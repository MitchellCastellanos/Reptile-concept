"use client";

import { useState } from "react";
import {
  buildSpeciesChatGptPrompt,
  parseSpeciesChatGptResponse,
} from "@/lib/species-chatgpt-prompt";
import type { SpeciesFormFields } from "@/lib/species-utils";

/**
 * Manual copy → ChatGPT → paste → parse helper for the species form.
 * No AI API call happens here: the admin copies the generated prompt into
 * ChatGPT themselves, pastes the labeled reply back, and this component
 * only parses that text into form fields for review before saving.
 */
export function SpeciesChatGptHelper({
  scientificName,
  onApply,
}: {
  scientificName: string;
  onApply: (fields: Partial<SpeciesFormFields>) => void;
}) {
  const [notes, setNotes] = useState("");
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState(false);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  const prompt = buildSpeciesChatGptPrompt({ scientificName, notes });
  const canGeneratePrompt = scientificName.trim().length > 0;

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleApply() {
    const parsed = parseSpeciesChatGptResponse(reply);
    onApply(parsed);
    setAppliedCount(Object.keys(parsed).length);
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-dashed border-black/20 p-4 text-sm dark:border-white/20">
      <div>
        <p className="font-medium">Helper ChatGPT (copier / coller)</p>
        <p className="text-zinc-600 dark:text-zinc-400">
          Aucune API IA n&apos;est appelée. Copiez le prompt ci-dessous dans ChatGPT,
          collez sa réponse, puis appliquez-la aux champs du formulaire.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        Notes additionnelles (optionnel)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="ex : morph spécifique, ton pour débutants, etc."
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1">
        Prompt généré
        <textarea
          value={prompt}
          readOnly
          rows={8}
          className="rounded border border-black/20 bg-black/[0.03] px-3 py-2 font-mono text-xs dark:border-white/20 dark:bg-white/[0.03]"
        />
      </label>

      <button
        type="button"
        onClick={handleCopy}
        disabled={!canGeneratePrompt}
        className="w-fit rounded border border-black/20 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-white/20"
      >
        {copied ? "Copié !" : "Copier le prompt"}
      </button>

      <label className="flex flex-col gap-1">
        Réponse de ChatGPT (coller ici)
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={8}
          placeholder="COMMON_EN: ...&#10;COMMON_FR: ...&#10;..."
          className="rounded border border-black/20 px-3 py-2 font-mono text-xs dark:border-white/20 dark:bg-black"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleApply}
          disabled={!reply.trim()}
          className="w-fit rounded bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
        >
          Appliquer au formulaire
        </button>
        {appliedCount !== null && (
          <span className="text-zinc-600 dark:text-zinc-400">
            {appliedCount > 0
              ? `${appliedCount} champ(s) mis à jour — vérifiez avant d'enregistrer.`
              : "Aucun champ reconnu dans la réponse collée."}
          </span>
        )}
      </div>
    </div>
  );
}
