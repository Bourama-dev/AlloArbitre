import type { MatchStatus } from "@/lib/matches";

const styles: Record<MatchStatus, string> = {
  incomplet: "text-[var(--warning)] bg-[var(--warning-bg)]",
  complet: "text-[var(--success)] bg-[var(--success-bg)]",
  annule: "text-[var(--muted)] bg-[var(--neutral-bg)]",
};

const labels: Record<MatchStatus, string> = {
  incomplet: "Incomplet",
  complet: "Complet",
  annule: "Annulé",
};

export function StatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span
      className={`badge ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
