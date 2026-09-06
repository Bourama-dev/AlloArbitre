import Link from "next/link";
import { matchStatus } from "@/lib/match-status";
import { formatDateTimeFr } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";
import type { MatchWithRelations } from "@/lib/matches";

export function MatchesTable({
  matches,
  selectable = false,
}: {
  matches: MatchWithRelations[];
  selectable?: boolean;
}) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)] py-10 text-center card">
        Aucun match ne correspond à ces filtres.
      </p>
    );
  }

  return (
    <div className="table-shell overflow-x-auto">
      <table>
        <thead>
          <tr>
            {selectable && <th className="w-8" />}
            <th>Date</th>
            <th>Niveau</th>
            <th>Domicile</th>
            <th>Extérieur</th>
            <th>Lieu</th>
            <th>Arbitres</th>
            <th>Statut</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => {
            const status = matchStatus(m);
            return (
              <tr key={m.id}>
                {selectable && (
                  <td>
                    {status === "incomplet" && (
                      <input type="checkbox" name="matchIds" value={m.id} />
                    )}
                  </td>
                )}
                <td className="whitespace-nowrap">{formatDateTimeFr(m.date)}</td>
                <td className="whitespace-nowrap text-[var(--muted)]">
                  {m.competitionLevel.label}
                </td>
                <td className="font-medium whitespace-nowrap">{m.homeTeam}</td>
                <td className="font-medium whitespace-nowrap">{m.awayTeam}</td>
                <td className="whitespace-nowrap text-[var(--muted)]">{m.venue ?? "-"}</td>
                <td className="min-w-[10rem]">
                  {m.designations.length === 0 ? (
                    <span className="text-[var(--muted)]">
                      Aucun arbitre ({0}/{m.refereesRequired})
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {m.designations.map((d) => (
                        <Link
                          key={d.id}
                          href={`/arbitres/${d.referee.id}`}
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <span className="avatar-chip">
                            {d.referee.firstName.charAt(0)}
                            {d.referee.lastName.charAt(0)}
                          </span>
                          {d.referee.firstName} {d.referee.lastName}
                        </Link>
                      ))}
                      {m.designations.length < m.refereesRequired && (
                        <span className="text-[var(--muted)] text-xs">
                          ({m.designations.length}/{m.refereesRequired})
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <StatusBadge status={status} />
                </td>
                <td className="text-right whitespace-nowrap">
                  <Link href={`/matchs/${m.id}`} className="btn-ghost text-sm">
                    Détails
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
