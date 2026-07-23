import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth";
import { logoutAction } from "./actions";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-black/10 dark:border-white/10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold">
              Admin
            </Link>
            <Link href="/admin/species" className="text-sm">
              Espèces
            </Link>
            <Link href="/admin/animals" className="text-sm">
              Animaux
            </Link>
            <Link href="/admin/products" className="text-sm">
              Produits
            </Link>
            <Link href="/admin/orders" className="text-sm">
              Commandes
            </Link>
            <Link href="/admin/customers" className="text-sm">
              Clients
            </Link>
            <Link href="/admin/announcements" className="text-sm">
              Annonces
            </Link>
            <Link href="/admin/finance" className="text-sm">
              Finances
            </Link>
            <Link href="/admin/reviews" className="text-sm">
              Avis
            </Link>
            <Link href="/admin/settings" className="text-sm">
              Réglages
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <span>{admin.email}</span>
            <form action={logoutAction}>
              <button type="submit" className="underline">
                Déconnexion
              </button>
            </form>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
