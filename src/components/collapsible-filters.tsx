"use client";

import { useState } from "react";

/**
 * Filtres repliés par défaut sur mobile (un seul bouton « Filtres » au lieu
 * d'un gros formulaire) ; toujours visibles à partir des grands écrans.
 */
export function CollapsibleFilters({
  activeCount = 0,
  label = "Filtres",
  children,
}: {
  activeCount?: number;
  /** Libellé du bouton (ex. « Nouvelle période » pour un formulaire de création). */
  label?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="chip-btn lg:hidden"
        data-on={activeCount > 0 || open}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label === "Filtres" && (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        )}
        {label}{activeCount > 0 ? ` · ${activeCount}` : ""}
      </button>
      <div className={open ? "block mt-2 animate-slide-down" : "hidden lg:block"}>{children}</div>
    </div>
  );
}
