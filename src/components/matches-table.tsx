import Link from "next/link";
import { matchStatus } from "@/lib/match-status";
import { formatDateTimeFr } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import type { ActiveReferee, MatchWithRelations } from "@/lib/matches";

export function MatchesTable({
  matches,
  selectable = false,
  referees,
  designateAction,
}: {
  matches: MatchWithRelations[];
  selectable?: boolean;
  /** Arbitres actifs, pour la désignation directe depuis un menu déroulant sur chaque ligne incomplète. */
  referees?: ActiveReferee[];
  designateAction?: (formData: FormData) => void | Promise<void>;
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
            <th>N°national</th>
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
                          <span className="text-[var(--muted)] text-xs">(A{d.position})</span>
                        </Link>
                      ))}
                      {m.designations.length < m.refereesRequired && (
                        <span className="text-[var(--muted)] text-xs">
                          ({m.designations.length}/{m.refereesRequired})
                        </span>
                      )}
                    </div>
                  )}
                  {designateAction && referees && status === "incomplet" && (
                    <form action={designateAction} className="flex items-center gap-1 mt-1">
                      <input type="hidden" name="matchId" value={m.id} />
                      <select
                        name="refereeId"
                        required
                        defaultValue=""
                        className="input text-xs py-1"
                      >
                        <option value="" disabled>
                          Désigner…
                        </option>
                        {referees
                          .filter((r) => !m.designations.some((d) => d.refereeId === r.id))
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.firstName} {r.lastName} ({r.levelLabel})
                            </option>
                          ))}
                      </select>
                      <SubmitButton className="btn btn-primary text-xs px-2 py-1" pendingLabel="…">
                        OK
                      </SubmitButton>
                    </form>
                  )}
                </td>
                <td className="whitespace-nowrap text-[var(--muted)]">
                  {m.designations.length === 0 ? (
                    "-"
                  ) : (
                    <div className="flex flex-col gap-1">
                      {m.designations.map((d) => (
                        <span key={d.id}>{d.referee.nationalNumber ?? "-"}</span>
                      ))}
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
