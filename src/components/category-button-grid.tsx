import Image from "next/image";
import { Link } from "@/i18n/navigation";

export type CategoryButtonItem = {
  key: string;
  href: string;
  image: string;
  label: string;
  active?: boolean;
};

export function CategoryButtonGrid({ items }: { items: CategoryButtonItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map(({ key, href, image, label, active }) => (
        <Link
          key={key}
          href={href}
          className={`flex flex-col items-center gap-3 rounded-2xl border p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md ${
            active ? "border-primary bg-accent-light" : "border-border bg-card"
          }`}
        >
          <span className="relative h-16 w-16 overflow-hidden rounded-xl">
            <Image src={image} alt="" fill className="object-cover" />
          </span>
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </Link>
      ))}
    </div>
  );
}
