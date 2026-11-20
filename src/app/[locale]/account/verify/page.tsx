"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { completeRegistrationAction } from "../actions";

function VerifyForm() {
  const t = useTranslations("Account");
  const token = useSearchParams().get("token") ?? "";
  const [state, formAction, pending] = useActionState(completeRegistrationAction.bind(null, token), undefined);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t("registerTitle")}</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {t("password")}
          <input
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-50"
        >
          {pending ? "..." : t("registerButton")}
        </button>
      </form>
    </main>
  );
}

export default function AccountVerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
