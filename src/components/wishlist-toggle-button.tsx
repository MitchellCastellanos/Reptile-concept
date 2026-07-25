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
}: {
  type: "animal" | "product";
  itemId: string;
  initialActive?: boolean;
  label?: string;
}) {
  const t = useTranslations("Account");
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setActive((prev) => !prev);
        startTransition(async () => {
          await toggleWishlistAction(type, itemId);
          router.refresh();
        });
      }}
      className="w-fit text-xs font-medium text-primary hover:underline disabled:opacity-50"
    >
      {label ?? (active ? t("removeFromWishlist") : t("addToWishlist"))}
    </button>
  );
}
