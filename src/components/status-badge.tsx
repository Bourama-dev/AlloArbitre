import type { MatchStatus } from "@/lib/matches";

const styles: Record<MatchStatus, string> = {
  incomplet: "bg-amber-100 text-amber-800",
  complet: "bg-green-100 text-green-800",
  annule: "bg-neutral-200 text-neutral-600",
};

const labels: Record<MatchStatus, string> = {
  incomplet: "Incomplet",
  complet: "Complet",
  annule: "Annulé",
};

export function StatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
