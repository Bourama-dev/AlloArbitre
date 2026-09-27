import Link from "next/link";
import { runDesignationControls } from "@/lib/controls";
import { formatDateTimeFr } from "@/lib/dates";

export const dynamic = "force-dynamic";

const PERIODS = [7, 14, 30, 60];

export default async function ControlsPage({ searchParams }: { searchParams: Promise<{ jours?: string }> }) {
  const { jours } = await searchParams;
  const days = PERIODS.includes(Number(jours)) ? Number(jours) : 14;

  // Dates de match stockées à l'heure du gymnase (lues en UTC) : on part du début du jour.
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setUTCDate(from.getUTCDate() + days);

  const { issues, doubles, checked } = await runDesignationControls(from, to);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Contrôles</h1>
          <p className="text-sm text-[var(--muted)] max-w-3xl">
            Les désignations à venir sont revérifiées avec les règles actuelles : niveau, groupe, âge, club,
            horaires, indisponibilités, quotas et distance maximale. Une indisponibilité saisie après coup ou un
            changement de règle apparaît ici. Rien n&apos;est modifié automatiquement.
          </p>
        </div>
        <form className="flex items-center gap-2">
          <label htmlFor="jours" className="field-label">
            Période
          </label>
          <select id="jours" name="jours" defaultValue={String(days)} className="input">
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {p} prochains jours
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-secondary text-xs">
            Afficher
          </button>
        </form>
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-2">
          Désignations à corriger ({issues.length} sur {checked} vérifiée{checked > 1 ? "s" : ""})
        </h2>
        {issues.length === 0 ? (
          <p className="text-sm text-[var(--success)]">Aucune anomalie sur la période.</p>
        ) : (
          <div className="table-shell overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-medium">Match</th>
                  <th className="px-3 py-2 font-medium">Arbitre</th>
                  <th className="px-3 py-2 font-medium">Problème(s)</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={`${i.matchId}-${i.refereeId}`} className="align-top">
                    <td className="px-3 py-2">
                      <Link href={`/matchs/${i.matchId}`} className="hover:underline font-medium">
                        {i.matchLabel}
                      </Link>
                      <div className="text-xs text-[var(--muted)]">
                        {formatDateTimeFr(i.matchDate)} · {i.division}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link href={`/arbitres/${i.refereeId}`} className="hover:underline">
                        {i.refereeName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-[var(--danger)]">
                      <ul className="space-y-0.5">
                        {i.problems.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-1">Doublés possibles ({doubles.length})</h2>
        <p className="text-xs text-[var(--muted)] mb-2">
          Matchs incomplets dans un gymnase où un arbitre est déjà désigné le même jour, sur un créneau compatible :
          il est déjà sur place, sans frais de déplacement pour le 2e match. Ouvrez le match pour vérifier ses
          autres règles (quotas, niveau…) : s&apos;il est compatible, il apparaît en tête des suggestions.
        </p>
        {doubles.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aucun doublé possible sur la période.</p>
        ) : (
          <ul className="table-shell divide-y divide-[var(--border)]">
            {doubles.map((d) => (
              <li key={d.matchId} className="px-4 py-2.5 text-sm">
                <Link href={`/matchs/${d.matchId}`} className="hover:underline font-medium">
                  {d.matchLabel}
                </Link>
                <span className="text-xs text-[var(--muted)]">
                  {" "}
                  · {formatDateTimeFr(d.matchDate)} · {d.venue} · {d.missing} arbitre{d.missing > 1 ? "s" : ""} manquant
                  {d.missing > 1 ? "s" : ""}
                </span>
                <ul className="text-xs mt-1 space-y-0.5">
                  {d.referees.map((r) => (
                    <li key={r.id}>
                      <Link href={`/arbitres/${r.id}`} className="text-[var(--accent)] hover:underline">
                        {r.name}
                      </Link>{" "}
                      <span className="text-[var(--muted)]">déjà sur place ({r.otherMatch})</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
