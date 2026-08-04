"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toggleWishlistAction } from "@/app/[locale]/account/actions";

const HEART_PATH =
  "M12 20.5s-7-4.35-9.5-8.5C.9 8.6 2.4 5 6 5c2 0 3.3 1.1 4 2.2C10.7 6.1 12 5 14 5c3.6 0 5.1 3.6 3.5 7-2.5 4.15-9.5 8.5-9.5 8.5z";

const POP_DURATION_MS = 500;

export function WishlistToggleButton({
  type,
  itemId,
  initialActive = false,
  label,
  variant = "text",
  isLoggedIn,
}: {
  type: "animal" | "product";
  itemId: string;
  initialActive?: boolean;
  label?: string;
  variant?: "text" | "icon";
  // Known server-side by every caller — lets a guest click go straight to
  // /account/login instead of optimistically flipping the heart and then
  // yanking them there once the server action's own redirect lands.
  isLoggedIn: boolean;
}) {
  const t = useTranslations("Account");
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();
  const [justActivated, setJustActivated] = useState(false);

  function handleClick(e: React.MouseEvent) {
    // May be nested inside a card <Link> (variant="icon"); stop it from also
    // triggering navigation to the item's detail page.
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push("/account/login");
      return;
    }

    const nextActive = !active;
    setActive(nextActive);
    if (nextActive) {
      setJustActivated(true);
      setTimeout(() => setJustActivated(false), POP_DURATION_MS);
    }
    startTransition(async () => {
      await toggleWishlistAction(type, itemId);
      router.refresh();
    });
  }

  const activeLabel = active ? t("removeFromWishlist") : t("addToWishlist");

  const heart = (
    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
      {justActivated ? (
        <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" aria-hidden />
      ) : null}
      <svg
        viewBox="0 0 24 24"
        className={`relative h-5 w-5 ${justActivated ? "animate-heart-pop" : ""}`}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d={HEART_PATH} />
      </svg>
    </span>
  );

  if (variant === "icon") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        aria-label={activeLabel}
        title={activeLabel}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-accent shadow-sm backdrop-blur transition hover:bg-card disabled:opacity-50"
      >
        {heart}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/50 hover:text-accent disabled:opacity-50"
    >
      <span className="text-accent">{heart}</span>
      {label ?? activeLabel}
    </button>
  );
}
