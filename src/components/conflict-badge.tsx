/** Alerte sur une désignation déjà enregistrée mais incompatible avec un autre match du même arbitre. */
export function ConflictBadge({ conflict }: { conflict?: string | null }) {
  if (!conflict) return null;
  return (
    <span
      title={conflict}
      aria-label={conflict}
      className="badge text-[var(--danger)] bg-[var(--danger-bg)] cursor-help"
    >
      ⚠ conflit
    </span>
  );
}
