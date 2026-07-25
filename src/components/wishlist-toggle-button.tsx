"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toggleWishlistAction } from "@/app/[locale]/account/actions";

export function WishlistToggleButton({
  type,
  itemId,
  initialActive = false,
  label,
  variant = "text",
}: {
  type: "animal" | "product";
  itemId: string;
  initialActive?: boolean;
  label?: string;
  variant?: "text" | "icon";
}) {
  const t = useTranslations("Account");
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    // May be nested inside a card <Link> (variant="icon"); stop it from also
    // triggering navigation to the item's detail page.
    e.preventDefault();
    e.stopPropagation();
    setActive((prev) => !prev);
    startTransition(async () => {
      await toggleWishlistAction(type, itemId);
      router.refresh();
    });
  }

  if (variant === "icon") {
    const activeLabel = active ? t("removeFromWishlist") : t("addToWishlist");
    return (
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        aria-label={activeLabel}
        title={activeLabel}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-accent shadow-sm backdrop-blur transition hover:bg-card disabled:opacity-50"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 20.5s-7-4.35-9.5-8.5C.9 8.6 2.4 5 6 5c2 0 3.3 1.1 4 2.2C10.7 6.1 12 5 14 5c3.6 0 5.1 3.6 3.5 7-2.5 4.15-9.5 8.5-9.5 8.5z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="w-fit text-xs font-medium text-primary hover:underline disabled:opacity-50"
    >
      {label ?? (active ? t("removeFromWishlist") : t("addToWishlist"))}
    </button>
  );
}
