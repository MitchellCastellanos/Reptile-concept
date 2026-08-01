"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const IMAGE_SRC = "/images/coming-soon.jpg";

export function ComingSoonPage() {
  const router = useRouter();
  const [showStaff, setShowStaff] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageOk, setImageOk] = useState(true);

  async function handleStaffSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/site-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Invalid password");
        return;
      }
      router.push("/fr");
      router.refresh();
    } catch {
      setError("Connection error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0f1410] px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(74,124,89,0.25),_transparent_60%)]" />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <div className="relative mb-8 aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/40">
          {imageOk ? (
            <Image
              src={IMAGE_SRC}
              alt="Reptile Concept — coming soon"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 640px"
              onError={() => setImageOk(false)}
            />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center bg-gradient-to-br from-emerald-950 via-[#1a2e1f] to-[#0f1410] text-6xl">
              🦎
            </div>
          )}
        </div>

        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-emerald-300/90">
          Reptile Concept · Lachine, QC
        </p>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Quelque chose d&apos;excitant arrive
        </h1>
        <p className="mt-3 max-w-lg text-lg text-white/75">
          Nous préparons une toute nouvelle expérience pour les passionnés de reptiles et d&apos;amphibiens.
          Revenez bientôt!
        </p>

        <div className="my-8 h-px w-16 bg-white/20" aria-hidden />

        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Something exciting is on the way
        </h2>
        <p className="mt-3 max-w-lg text-lg text-white/75">
          We&apos;re building a brand-new experience for reptile and amphibian enthusiasts.
          Check back soon!
        </p>

        <button
          type="button"
          onClick={() => setShowStaff(true)}
          className="mt-10 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/80 backdrop-blur transition hover:border-white/40 hover:bg-white/10 hover:text-white"
        >
          Staff access
        </button>
      </div>

      {showStaff ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a211c] p-6 shadow-xl">
            <h2 id="staff-title" className="text-lg font-semibold text-white">
              Staff access
            </h2>
            <p className="mt-1 text-sm text-white/60">Accès équipe / Team access</p>
            <form onSubmit={handleStaffSubmit} className="mt-4 flex flex-col gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-white placeholder:text-white/40 outline-none focus:border-emerald-400/50"
              />
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowStaff(false);
                    setPassword("");
                    setError("");
                  }}
                  className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/70 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loading ? "…" : "Enter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
