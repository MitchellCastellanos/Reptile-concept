import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { getAdminCatalogCounts } from "@/lib/admin-catalog-counts";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const catalogCounts = await getAdminCatalogCounts();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar adminEmail={admin.email} catalogCounts={catalogCounts} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
