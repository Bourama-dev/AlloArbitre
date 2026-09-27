"use client";

import { useMemo, useState } from "react";

export type PickerItem = { id: string; label: string; hint?: string };

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Liste de cases à cocher filtrable, à placer dans un <form> : chaque case
 * cochée est envoyée sous `name`. La recherche porte aussi sur `hint` (ex.
 * niveau de l'arbitre), et « Cocher les résultats » coche tout ce qui est
 * affiché - pratique pour ajouter tout un niveau à un groupe.
 */
export function CheckboxPicker({
  name,
  items,
  selected,
  placeholder = "Filtrer…",
}: {
  name: string;
  items: PickerItem[];
  selected: string[];
  placeholder?: string;
}) {
  const [checked, setChecked] = useState<Set<string>>(() => new Set(selected));
  const [search, setSearch] = useState("");
  const term = normalize(search.trim());
  const visible = useMemo(
    () => (term ? items.filter((i) => normalize(`${i.label} ${i.hint ?? ""}`).includes(term)) : items),
    [items, term]
  );

  function toggle(id: string, on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function setVisible(on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const i of visible) {
        if (on) next.add(i.id);
        else next.delete(i.id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="input w-full sm:w-64"
        />
        <button type="button" onClick={() => setVisible(true)} className="btn btn-secondary text-xs">
          Cocher les résultats
        </button>
        <button type="button" onClick={() => setVisible(false)} className="btn btn-secondary text-xs">
          Décocher les résultats
        </button>
        <span className="text-xs text-[var(--muted)]">{checked.size} sélectionné(s)</span>
      </div>
      {/* Les cases filtrées restent envoyées : champs cachés pour la sélection hors filtre. */}
      {[...checked]
        .filter((id) => !visible.some((i) => i.id === id))
        .map((id) => (
          <input key={id} type="hidden" name={name} value={id} />
        ))}
      <div className="max-h-64 overflow-y-auto border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
        {visible.length === 0 && <p className="text-sm text-[var(--muted)] p-2">Aucun résultat.</p>}
        {visible.map((i) => (
          <label key={i.id} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              name={name}
              value={i.id}
              checked={checked.has(i.id)}
              onChange={(e) => toggle(i.id, e.target.checked)}
            />
            <span>{i.label}</span>
            {i.hint && <span className="text-xs text-[var(--muted)]">{i.hint}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}
