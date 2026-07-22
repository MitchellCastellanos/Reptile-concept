import Image from "next/image";
import "./globals.css";

export default function RootNotFound() {
  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
        <a href="/" className="block w-full max-w-md">
          <Image
            src="/images/not-found.png"
            alt="Oups! Vous êtes perdu(e) — cette page n'existe pas. Retour à l'accueil."
            width={1448}
            height={1086}
            className="w-full h-auto"
            priority
          />
        </a>
      </body>
    </html>
  );
}
