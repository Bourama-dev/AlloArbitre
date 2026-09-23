"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { matchStatus } from "@/lib/match-status";
import { formatDateTimeFr } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { PushToFbiButton } from "@/components/push-to-fbi-button";
import type { ActiveReferee, MatchWithRelations } from "@/lib/matches";
import type { FbiRencontreDetail } from "@/lib/fbi/detail";

const presenceStyles: Record<string, string> = {
  "Présent": "text-[var(--success)] bg-[var(--success-bg)]",
  "Absent": "text-[var(--danger)] bg-[var(--danger-bg)]",
};

/**
 * Une ligne = un match AlloArbitre (avec désignation directe si incomplet et
 * push vers FBI), dépliable pour voir l'état FBI correspondant (officiels
 * désignés + infos rencontre), chargé à la demande via son fbiIdRencontre.
 * Remplace les deux tableaux séparés (matchs AlloArbitre / rencontres FBI)
 * qui coexistaient auparavant sur /fbi.
 */
export function FbiMatchRow({
  m,
  referees,
  designateAction,
  selectable = false,
}: {
  m: MatchWithRelations;
  referees: ActiveReferee[];
  designateAction: (formData: FormData) => void | Promise<void>;
  selectable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<FbiRencontreDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const status = matchStatus(m);
  const router = useRouter();

  function toggle() {
    setOpen((v) => !v);
    if (detail || error || isPending || !m.fbiIdRencontre) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/fbi-sync?detail=${m.fbiIdRencontre}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
        setDetail(data);
        if (data.designationsSynced > 0) router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  }

  return (
    <>
      <tr className="cursor-pointer hover:bg-[var(--neutral-bg)]" onClick={toggle}>
        {selectable && (
          <td onClick={(e) => e.stopPropagation()}>
            {status === "incomplet" && <input type="checkbox" name="matchIds" value={m.id} />}
          </td>
        )}
        <td className="whitespace-nowrap">{formatDateTimeFr(m.date)}</td>
        <td className="whitespace-nowrap text-[var(--muted)]">
          {m.competitionLevel.label}
          {m.poule ? ` · ${m.poule}` : ""}
        </td>
        <td className="font-medium whitespace-nowrap">{m.homeTeam}</td>
        <td className="font-medium whitespace-nowrap">{m.awayTeam}</td>
        <td className="whitespace-nowrap text-[var(--muted)]">
          {m.venue ?? "-"}
          {m.city ? ` - ${m.city}` : ""}
        </td>
        <td className="min-w-[10rem]" onClick={(e) => e.stopPropagation()}>
          {m.designations.length === 0 ? (
            <span className="text-[var(--muted)]">Aucun arbitre (0/{m.refereesRequired})</span>
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
          {status === "incomplet" && (
            <form action={designateAction} className="flex items-center gap-1 mt-1">
              <input type="hidden" name="matchId" value={m.id} />
              <select name="refereeId" required defaultValue="" className="input text-xs py-1">
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
        <td>
          <StatusBadge status={status} />
        </td>
        <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <div className="inline-flex flex-col items-end gap-1">
            {m.designations.length > 0 && <PushToFbiButton matchId={m.id} />}
            <button type="button" onClick={toggle} className="text-[var(--accent)] hover:underline text-xs inline-flex items-center gap-1">
              {open ? "Masquer" : "Détail FBI"}
              <span aria-hidden>{open ? "▲" : "▼"}</span>
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={selectable ? 9 : 8} className="bg-[var(--neutral-bg)] p-0">
            <div className="p-4 space-y-3">
              {!m.fbiIdRencontre && (
                <p className="text-sm text-[var(--muted)]">
                  Pas encore d&apos;identifiant FBI pour ce match - relancez l&apos;import du calendrier.
                </p>
              )}
              {isPending && !detail && !error && <p className="text-sm text-[var(--muted)]">Chargement…</p>}
              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
              {detail && (
                <>
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Officiels désignés sur FBI ({detail.officiels.length})
                    </h3>
                    {detail.officiels.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">Aucun officiel désigné sur FBI pour cette rencontre.</p>
                    ) : (
                      <div className="table-shell overflow-x-auto">
                        <table>
                          <thead>
                            <tr>
                              <th>Nom</th>
                              <th>Prénom</th>
                              <th>Fonction</th>
                              <th>N° licence</th>
                              <th>Présence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.officiels.map((o, i) => (
                              <tr key={`${o.licence}-${i}`}>
                                <td className="font-medium whitespace-nowrap">{o.nom || "-"}</td>
                                <td className="whitespace-nowrap">{o.prenom || "-"}</td>
                                <td className="whitespace-nowrap">{o.fonction || "-"}</td>
                                <td className="whitespace-nowrap text-[var(--muted)]">{o.licence || "-"}</td>
                                <td>
                                  {o.presence ? (
                                    <span className={`badge ${presenceStyles[o.presence] ?? "text-[var(--muted)] bg-[var(--neutral-bg)]"}`}>
                                      {o.presence}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                  {detail.infos.length > 0 && (
                    <section className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Rencontre (FBI)</h3>
                      <dl className="card p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        {detail.infos.map((i) => (
                          <div key={i.label} className="flex gap-2">
                            <dt className="text-[var(--muted)] shrink-0">{i.label}</dt>
                            <dd className="font-medium">{i.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
