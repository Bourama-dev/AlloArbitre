"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavLink = { href: string; label: string };

function linkClass(active: boolean) {
  return `px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
    active
      ? "bg-[var(--brand-tint)] text-[var(--brand)]"
      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--neutral-bg)]"
  }`;
}

export function NavLinks({
  links,
  adminLinks,
}: {
  links: NavLink[];
  adminLinks?: NavLink[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const adminActive = (adminLinks ?? []).some((l) => pathname.startsWith(l.href));

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <nav className="hidden lg:flex items-center gap-1 text-sm">
      {links.map((l) => {
        const active = l.href === "/matchs" ? pathname === "/matchs" : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={linkClass(active)}>
            {l.label}
          </Link>
        );
      })}
      {adminLinks && adminLinks.length > 0 && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={linkClass(adminActive) + " inline-flex items-center gap-1"}
          >
            Admin
            <span className="text-[10px]">▾</span>
          </button>
          {open && (
            <div className="absolute left-0 top-full mt-1 w-44 card p-1 z-20">
              {adminLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-1.5 rounded-md text-sm ${
                    pathname.startsWith(l.href)
                      ? "bg-[var(--brand-tint)] text-[var(--brand)]"
                      : "text-[var(--foreground)] hover:bg-[var(--neutral-bg)]"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
