"use client";

import { useEffect, useState } from "react";
import { NavIcon, type NavIconName } from "@/components/nav-icons";

type Tab = { id: string; label: string; icon: NavIconName };

/**
 * Barre du bas de l'espace arbitre : sections de la page (disponibilités,
 * désignations, suivi, compte) avec défilement doux et onglet actif suivi au
 * scroll. Les arbitres n'ont pas la navigation du staff.
 */
export function RefereeTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const els = tabs.map((t) => document.getElementById(t.id)).filter((e): e is HTMLElement => !!e);
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [tabs]);

  return (
    <nav className="bottom-nav" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }} aria-label="Sections">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className="tab"
          data-active={active === t.id}
          onClick={() => {
            setActive(t.id);
            try {
              navigator.vibrate?.(6);
            } catch {
              /* sans effet */
            }
            document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <span className="tab-icon">
            <NavIcon name={t.icon} className="w-6 h-6" />
          </span>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
