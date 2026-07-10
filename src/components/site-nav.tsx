import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SiteNav() {
  const t = useTranslations("Nav");

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          Reptile Concept
        </Link>
        <div className="flex gap-6 text-sm font-medium">
          <Link href="/">{t("home")}</Link>
          <Link href="/animals">{t("animals")}</Link>
          <Link href="/boutique">{t("boutique")}</Link>
        </div>
      </nav>
    </header>
  );
}
