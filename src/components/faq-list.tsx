"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/toolbox";

/** FAQ avec recherche instantanée (question, réponse, catégorie), groupée par catégorie. */
export function FaqList({ items, editById }: { items: FaqItem[]; editById?: Record<string, React.ReactNode> }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q
    ? items.filter((i) => `${i.question} ${i.answer} ${i.category}`.toLowerCase().includes(q))
    : items;
  const categories = [...new Set(shown.map((i) => i.category))];

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher (ex. réclamation, mineur, retard…)"
        className="input w-full"
        aria-label="Rechercher dans la FAQ"
      />
      {shown.length === 0 ? (
        <p className="text-sm text-[var(--muted)] card p-4">
          {items.length === 0
            ? "Aucune question pour l'instant."
            : "Aucune réponse ne correspond. Essayez un autre mot, ou demandez à votre répartiteur."}
        </p>
      ) : (
        categories.map((cat) => (
          <section key={cat} className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{cat}</h3>
            {shown
              .filter((i) => i.category === cat)
              .map((i) => (
                <details key={i.id} className="card p-4" open={!!q && shown.length <= 3}>
                  <summary className="cursor-pointer text-sm font-semibold flex items-start justify-between gap-2">
                    <span>{i.question}</span>
                    {!i.active && <span className="badge text-[var(--muted)] bg-[var(--neutral-bg)] shrink-0">Brouillon</span>}
                  </summary>
                  <p className="text-sm mt-2 whitespace-pre-line">{i.answer}</p>
                  {editById?.[i.id]}
                </details>
              ))}
          </section>
        ))
      )}
    </div>
  );
}
