import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { SiteNav } from "@/components/site-nav";

export async function SiteNavWrapper() {
  const customer = await getCurrentCustomer();
  const wishlistCount = customer
    ? await prisma.wishlistItem.count({ where: { customerId: customer.id } })
    : 0;

  return <SiteNav isLoggedIn={Boolean(customer)} wishlistCount={wishlistCount} />;
}
