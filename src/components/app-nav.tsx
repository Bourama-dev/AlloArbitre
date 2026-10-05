"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NavIcon, type NavIconName } from "@/components/nav-icons";

export type AppNavLink = { href: string; label: string; shortLabel?: string; icon: NavIconName };

type Props = {
  /** Onglets de la barre du bas (4 maximum) : aussi le haut du rail latéral sur grand écran. */
  tabs: AppNavLink[];
  /** Pages secondaires : feuille « Plus » sur mobile, suite du rail sur grand écran. */
  more: AppNavLink[];
  admin?: AppNavLink[];
  userLabel: string;
  logoutAction: () => void;
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function buzz() {
  // Retour haptique discret sur les appareils qui le permettent.
  try {
    navigator.vibrate?.(6);
  } catch {
    /* sans effet */
  }
}

export function AppNav({ tabs, more, admin, userLabel, logoutAction }: Props) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const initial = (userLabel || "?").charAt(0).toUpperCase();

  const allSecondary = [...more, ...(admin ?? [])];
  const moreActive =
    pathname.startsWith("/compte") || allSecondary.some((l) => isActive(pathname, l.href));

  // Fermeture avec la touche Échap, et page figée derrière la feuille ouverte.
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  function onDragStart(e: React.TouchEvent) {
    dragStart.current = e.touches[0].clientY;
  }
  function onDragMove(e: React.TouchEvent) {
    if (dragStart.current == null) return;
    setDragY(Math.max(0, e.touches[0].clientY - dragStart.current));
  }
  function onDragEnd() {
    if (dragY > 90) setSheetOpen(false);
    setDragY(0);
    dragStart.current = null;
  }

  return (
    <>
      {/* ---- Rail latéral (tablette large / ordinateur) ---- */}
      <aside className="side-nav" aria-label="Navigation principale">
        <Link href="/matchs" className="px-2 pt-1 pb-4 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-alloarbitre.png"
            alt="AlloArbitre"
            width={900}
            height={284}
            className="h-14 w-auto rounded-xl bg-white px-2"
          />
        </Link>
        <nav className="flex-1 overflow-y-auto space-y-5 pr-1">
          <ul className="space-y-1">
            {[...tabs, ...more].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="side-link" data-active={isActive(pathname, l.href)}>
                  <NavIcon name={l.icon} className="w-5 h-5 shrink-0" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {admin && admin.length > 0 && (
            <div>
              <p className="field-label px-3">Administration</p>
              <ul className="space-y-1">
                {admin.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="side-link" data-active={isActive(pathname, l.href)}>
                      <NavIcon name={l.icon} className="w-5 h-5 shrink-0" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
        <div className="pt-3 mt-3 border-t border-[var(--border)] space-y-1">
          <Link href="/compte" className="side-link" data-active={pathname.startsWith("/compte")}>
            <span className="avatar-chip">{initial}</span>
            <span className="truncate">{userLabel}</span>
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="side-link w-full">
              <NavIcon name="logout" className="w-5 h-5 shrink-0" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* ---- Barre du bas (mobile / tablette) ---- */}
      <nav className="bottom-nav" aria-label="Navigation principale">
        {tabs.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className="tab"
              data-active={active}
              aria-current={active ? "page" : undefined}
              onClick={buzz}
            >
              <span className="tab-icon">
                <NavIcon name={l.icon} className="w-6 h-6" />
              </span>
              <span className="tab-label">{l.shortLabel ?? l.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className="tab"
          data-active={moreActive || sheetOpen}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => {
            buzz();
            setSheetOpen(true);
          }}
        >
          <span className="tab-icon">
            <NavIcon name="plus" className="w-6 h-6" />
          </span>
          <span className="tab-label">Plus</span>
        </button>
      </nav>

      {/* ---- Feuille « Plus » ---- */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Plus">
          <button
            type="button"
            aria-label="Fermer"
            className="sheet-backdrop absolute inset-0"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="sheet"
            style={dragY ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
          >
            <div
              className="pt-3 pb-2 touch-none"
              onTouchStart={onDragStart}
              onTouchMove={onDragMove}
              onTouchEnd={onDragEnd}
            >
              <div className="mx-auto h-1.5 w-10 rounded-full bg-[var(--border)]" />
            </div>

            <div className="px-4 pb-2 flex items-center gap-3">
              <span className="avatar-chip !w-10 !h-10 !text-sm">{initial}</span>
              <div className="min-w-0">
                <p className="font-semibold truncate">{userLabel}</p>
                <Link href="/compte" className="text-xs text-[var(--accent)]" onClick={() => setSheetOpen(false)}>
                  Mon compte
                </Link>
              </div>
            </div>

            <ul className="grid grid-cols-3 gap-2 p-4">
              {more.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="tile" data-active={isActive(pathname, l.href)} onClick={() => setSheetOpen(false)}>
                    <NavIcon name={l.icon} className="w-7 h-7" />
                    <span>{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {admin && admin.length > 0 && (
              <>
                <p className="field-label px-4">Administration</p>
                <ul className="grid grid-cols-3 gap-2 p-4 pt-2">
                  {admin.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="tile" data-active={isActive(pathname, l.href)} onClick={() => setSheetOpen(false)}>
                        <NavIcon name={l.icon} className="w-7 h-7" />
                        <span>{l.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <form action={logoutAction} className="px-4 pt-1 pb-4">
              <button type="submit" className="btn btn-secondary w-full !justify-start gap-3">
                <NavIcon name="logout" className="w-5 h-5" />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
