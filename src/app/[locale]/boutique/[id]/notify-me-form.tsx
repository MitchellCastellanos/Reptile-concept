"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { notifyMeAction } from "./actions";

export function NotifyMeForm({ productId }: { productId: string }) {
  const t = useTranslations("Boutique");
  const boundAction = notifyMeAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  if (state?.success) {
    return (
      <p className="rounded-xl border border-border bg-accent-light px-4 py-3 text-sm text-foreground">
        {t("notifyMeSuccess")}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl border border-border bg-accent-light p-4">
      <p className="text-sm font-medium text-foreground">{t("notifyMeTitle")}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          placeholder={t("notifyMeEmailPlaceholder")}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-50"
        >
          {t("notifyMeSubmit")}
        </button>
      </div>
      {state?.error ? <p className="text-xs text-red-600">{t("notifyMeError")}</p> : null}
    </form>
  );
}
