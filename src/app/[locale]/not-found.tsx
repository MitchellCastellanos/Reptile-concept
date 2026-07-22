import Image from "next/image";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="block w-full max-w-md">
        <Image
          src="/images/not-found.png"
          alt="Oups! Vous êtes perdu(e) — cette page n'existe pas. Retour à l'accueil."
          width={1448}
          height={1086}
          className="w-full h-auto"
          priority
        />
      </Link>
    </main>
  );
}
