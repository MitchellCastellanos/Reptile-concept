import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminDashboard() {
  const [animalCount, productCount, orderCount, customerCount] = await Promise.all([
    prisma.animal.count({ where: { status: "available" } }),
    prisma.product.count(),
    prisma.order.count(),
    prisma.customer.count(),
  ]);

  const cards = [
    { href: "/admin/animals", label: "Animaux disponibles", value: animalCount },
    { href: "/admin/products", label: "Produits", value: productCount },
    { href: "/admin/orders", label: "Commandes", value: orderCount },
    { href: "/admin/customers", label: "Clients", value: customerCount },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-black/10 p-4 dark:border-white/10"
          >
            <p className="text-3xl font-semibold">{card.value}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
