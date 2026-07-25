import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar adminEmail={admin.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
