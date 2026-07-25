"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loginAction } from "../actions";

export default function AccountLoginPage() {
  const t = useTranslations("Account");
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t("loginTitle")}</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {t("email")}
          <input
            name="email"
            type="email"
            required
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("password")}
          <input
            name="password"
            type="password"
            required
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-50"
        >
          {pending ? "..." : t("loginButton")}
        </button>
      </form>
      <p className="text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/account/register" className="font-medium text-primary hover:underline">
          {t("createOne")}
        </Link>
      </p>
    </main>
  );
}
