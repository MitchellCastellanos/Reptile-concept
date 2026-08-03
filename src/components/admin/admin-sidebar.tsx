"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/(protected)/actions";

type NavLink = { href: string; label: string };
type NavSection = { title: string; links: NavLink[] };

const DASHBOARD_LINK: NavLink = { href: "/admin", label: "Tableau de bord" };

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Catalogue",
    links: [
      { href: "/admin/species", label: "Espèces" },
      { href: "/admin/animals", label: "Animaux" },
      { href: "/admin/products", label: "Produits" },
      { href: "/admin/clover-import", label: "Nouveaux articles Clover" },
    ],
  },
  {
    title: "Commandes",
    links: [{ href: "/admin/orders", label: "Commandes en ligne" }],
  },
  {
    title: "Clients",
    links: [
      { href: "/admin/customers", label: "Clients" },
      { href: "/admin/campaigns", label: "Campagnes" },
      { href: "/admin/reviews", label: "Avis" },
    ],
  },
  {
    title: "Site",
    links: [
      { href: "/admin/announcements", label: "Annonces" },
      { href: "/admin/performance", label: "Performance du site" },
      { href: "/admin/settings", label: "Réglages" },
    ],
  },
];

function isActiveLink(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavLinkItem({
  link,
  active,
  onNavigate,
}: {
  link: NavLink;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={`rounded-lg px-3 py-2 text-sm transition ${
        active ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-black/5"
      }`}
    >
      {link.label}
    </Link>
  );
}

function NavSectionGroup({
  section,
  pathname,
  onNavigate,
}: {
  section: NavSection;
  pathname: string;
  onNavigate?: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center justify-between rounded-lg px-3 py-1 text-sm font-bold text-zinc-700 hover:bg-black/5 dark:text-zinc-300"
      >
        {section.title}
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {expanded ? (
        <div className="flex flex-col gap-1">
          {section.links.map((link) => (
            <NavLinkItem key={link.href} link={link} active={isActiveLink(pathname, link.href)} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-4">
      <NavLinkItem link={DASHBOARD_LINK} active={isActiveLink(pathname, DASHBOARD_LINK.href)} onNavigate={onNavigate} />
      {NAV_SECTIONS.map((section) => (
        <NavSectionGroup key={section.title} section={section} pathname={pathname} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

export function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="no-print flex items-center justify-between border-b border-black/10 px-4 py-3 md:hidden">
        <Link href="/admin" className="font-semibold text-primary" onClick={() => setOpen(false)}>
          Reptiles Concept — Admin
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="rounded p-2 hover:bg-black/5"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </header>

      {open ? (
        <div className="no-print flex flex-col gap-4 border-b border-black/10 px-4 py-4 md:hidden">
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          <div className="flex items-center justify-between border-t border-black/10 pt-4 text-sm text-zinc-600">
            <span className="truncate">{adminEmail}</span>
            <form action={logoutAction}>
              <button type="submit" className="underline">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-black/10 px-4 py-6 md:flex">
        <Link href="/admin" className="mb-6 px-3 text-lg font-semibold text-primary">
          Reptiles Concept
        </Link>
        <div className="flex-1">
          <NavLinks pathname={pathname} />
        </div>
        <div className="mt-6 flex flex-col gap-2 border-t border-black/10 pt-4 text-sm text-zinc-600">
          <span className="truncate px-3">{adminEmail}</span>
          <form action={logoutAction}>
            <button type="submit" className="px-3 text-left underline">
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
