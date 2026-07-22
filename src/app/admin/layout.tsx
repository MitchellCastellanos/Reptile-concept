import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Reptile Concept — Admin",
  icons: {
    icon: "/icon.png",
  },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 dark:bg-black">{children}</body>
    </html>
  );
}
