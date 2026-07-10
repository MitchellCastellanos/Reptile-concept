import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Clients</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left dark:border-white/10">
            <th className="py-2">Nom</th>
            <th className="py-2">Email</th>
            <th className="py-2">Langue</th>
            <th className="py-2">Commandes</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2">{customer.fullName}</td>
              <td className="py-2">{customer.email}</td>
              <td className="py-2">{customer.preferredLang}</td>
              <td className="py-2">{customer._count.orders}</td>
              <td className="py-2">
                <Link href={`/admin/customers/${customer.id}`} className="underline">
                  Détails
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
