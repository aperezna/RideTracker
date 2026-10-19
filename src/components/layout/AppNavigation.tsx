"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/parks", label: "Parks" },
] as const;

export function AppNavigation() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav aria-label="Main navigation" className="border-b border-slate-800 bg-[#0b0f17] px-4 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 py-3">
        <Link className="text-sm font-bold tracking-wide text-slate-100" href="/">
          RideTracker
        </Link>
        <div className="flex items-center gap-2">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                className={`rounded-lg px-3 py-2 text-sm transition ${active ? "bg-emerald-400 font-semibold text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
