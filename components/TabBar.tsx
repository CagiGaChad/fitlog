"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Hoy" },
  { href: "/comidas", label: "Comidas" },
  { href: "/entrenos", label: "Entrenos" },
  { href: "/progreso", label: "Progreso" },
  { href: "/ajustes", label: "Ajustes" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex bg-surface/95 backdrop-blur border-t border-line"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              active ? "text-accent" : "text-dim"
            }`}
          >
            {tab.label}
            <span className={`h-1 w-1 rounded-full ${active ? "bg-accent" : "bg-transparent"}`} />
          </Link>
        );
      })}
    </nav>
  );
}
