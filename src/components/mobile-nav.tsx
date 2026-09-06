"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavLink = { href: string; label: string };

export function MobileNav({
  links,
  adminLinks,
  userLabel,
  logoutAction,
}: {
  links: NavLink[];
  adminLinks?: NavLink[];
  userLabel: string;
  logoutAction: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  return (
    <div className="lg:hidden" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        className="flex items-center justify-center w-9 h-9 rounded-md text-[var(--muted)] hover:bg-[var(--neutral-bg)] hover:text-[var(--foreground)]"
      >
        <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
      </button>
      {open && (
        <div className="fixed inset-x-0 top-16 z-20 bg-[var(--surface)] border-b border-[var(--border)] shadow-lg p-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {links.map((l) => {
            const active = l.href === "/matchs" ? pathname === "/matchs" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  active
                    ? "bg-[var(--brand-tint)] text-[var(--brand)]"
                    : "text-[var(--foreground)] hover:bg-[var(--neutral-bg)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {adminLinks && adminLinks.length > 0 && (
            <>
              <p className="field-label px-3 pt-2">Admin</p>
              {adminLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    pathname.startsWith(l.href)
                      ? "bg-[var(--brand-tint)] text-[var(--brand)]"
                      : "text-[var(--foreground)] hover:bg-[var(--neutral-bg)]"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </>
          )}
          <div className="pt-3 mt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
            <span className="text-sm text-[var(--muted)] truncate">{userLabel}</span>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-secondary text-xs">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
