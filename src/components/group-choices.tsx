"use client";

/** Cases « ajouter l'arbitre au groupe » affichées dans la fenêtre de confirmation. */
export function GroupChoices({
  groups,
  refereeName,
  value,
  onChange,
}: {
  groups: { id: string; label: string }[];
  refereeName: string;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  if (groups.length === 0) return null;
  return (
    <fieldset className="rounded-lg border border-[var(--border)] p-3 space-y-2">
      <legend className="px-1 text-xs font-semibold text-[var(--muted)]">Groupes de la division</legend>
      {groups.map((g) => (
        <label key={g.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.includes(g.id)}
            onChange={(e) => onChange(e.target.checked ? [...value, g.id] : value.filter((x) => x !== g.id))}
          />
          Ajouter {refereeName} au groupe {g.label}
        </label>
      ))}
    </fieldset>
  );
}
