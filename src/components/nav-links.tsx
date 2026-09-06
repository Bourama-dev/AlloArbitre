"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {links.map((l) => {
        const active = l.href === "/matchs" ? pathname === "/matchs" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              active
                ? "bg-[var(--brand-tint)] text-[var(--brand)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--neutral-bg)]"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
