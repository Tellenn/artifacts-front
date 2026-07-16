"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRealtimeStatus } from "@/lib/realtime";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Préfixes de routes supplémentaires rattachés à cet onglet. */
  match: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Personnages", icon: "⚔️", match: ["/characters"] },
  { href: "/map", label: "Carte", icon: "🗺️", match: [] },
  { href: "/bank", label: "Banque", icon: "🏦", match: [] },
  { href: "/tasks", label: "Tâches", icon: "📋", match: [] },
  { href: "/settings", label: "Réglages", icon: "⚙️", match: [] },
];

function isActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  return item.match.some((prefix) => pathname.startsWith(prefix));
}

/** Pastille d'état du temps réel WSS — remplace le libellé de polling quand actif. */
function RealtimeIndicator() {
  const status = useRealtimeStatus();

  if (status === "off") {
    return (
      <span className="hidden lg:block text-xs text-gray-500">
        Actualisé toutes les 10s
      </span>
    );
  }

  const style = {
    connected: { dot: "bg-emerald-500", label: "Temps réel" },
    connecting: { dot: "bg-amber-500 animate-pulse", label: "Connexion…" },
    error: { dot: "bg-red-500", label: "Erreur temps réel" },
  }[status];

  return (
    <span className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400">
      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
      {style.label}
    </span>
  );
}

export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Barre supérieure — brand toujours visible, liens sur desktop */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/90 backdrop-blur">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <Link href="/" className="font-bold tracking-tight">
            ⚔️ Artifacts MMO
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item, pathname) ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive(item, pathname)
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span className="mr-1.5" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>
          <RealtimeIndicator />
        </nav>
      </header>

      {/* Tab bar mobile — fixée en bas */}
      <nav
        aria-label="Navigation principale"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-gray-800 bg-gray-950/95 backdrop-blur"
      >
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item, pathname) ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] text-xs ${
                isActive(item, pathname) ? "text-white" : "text-gray-500"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
