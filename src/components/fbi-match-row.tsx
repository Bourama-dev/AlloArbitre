"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { matchStatus } from "@/lib/match-status";
import { formatDateTimeFr } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";
import { ConflictBadge } from "@/components/conflict-badge";
import { SubmitButton } from "@/components/submit-button";
import { GroupChoices } from "@/components/group-choices";
import { ConfirmModal } from "@/components/confirm-modal";
import { PushToFbiButton } from "@/components/push-to-fbi-button";
import { removeDesignation } from "@/lib/actions/designation-actions";
import type { ActiveReferee, MatchWithRelations } from "@/lib/matches";
import type { FbiRencontreDetail } from "@/lib/fbi/detail";

/** Résultat de la désignation directe d'une ligne : motif du refus éventuel. */
export type DesignateState = {
  error: string | null;
  warning?: string | null;
  /** Conflit d'horaire à confirmer : le répartiteur choisit de passer outre ou non. */
  confirm?: boolean;
  /** Arbitre visé (le formulaire est réinitialisé après l'action : on le conserve ici). */
  refereeId?: string;
  /** Groupes de la division proposés à l'ajout. */
  groups?: { id: string; label: string }[];
} | null;
export type DesignateAction = (prev: DesignateState, formData: FormData) => Promise<DesignateState>;

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
  designateAction: DesignateAction;
  selectable?: boolean;
}) {
  // Le motif d'un refus (indisponible, conflit, quota, club...) s'affiche sous
  // la ligne, sans recharger la page ni perdre les filtres.
  const [designState, designFormAction] = useActionState(designateAction, null);
  // Conflit d'horaire : fenêtre de confirmation au lieu d'un refus sec.
  const [dismissed, setDismissed] = useState<DesignateState>(null);
  const [isConfirming, startConfirm] = useTransition();
  const [addTo, setAddTo] = useState<string[]>([]);
  const confirming = !!designState?.confirm && dismissed !== designState;
  const confirmedReferee = designState?.refereeId
    ? referees.find((r) => r.id === designState.refereeId)
    : undefined;

  function confirmConflict() {
    if (!designState?.refereeId) return;
    const fd = new FormData();
    fd.set("matchId", m.id);
    fd.set("refereeId", designState.refereeId);
    fd.set("confirmConflict", "1");
    for (const id of addTo) fd.append("addToGroupIds", id);
    startConfirm(() => designFormAction(fd));
  }
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
          <td className="tc-check" onClick={(e) => e.stopPropagation()}>
            {status === "incomplet" && (
              <input type="checkbox" name="matchIds" value={m.id} aria-label={`Sélectionner ${m.homeTeam} - ${m.awayTeam}`} />
            )}
          </td>
        )}
        <td className="whitespace-nowrap tc-date tc-head">{formatDateTimeFr(m.date)}</td>
        <td className="whitespace-nowrap text-[var(--muted)] tc-head text-xs">
          {m.competitionLevel.label}
          {m.poule ? ` · ${m.poule}` : ""}
        </td>
        <td className="font-medium whitespace-nowrap tc-team">{m.homeTeam}</td>
        <td className="font-medium whitespace-nowrap tc-team tc-away">{m.awayTeam}</td>
        <td className="whitespace-nowrap text-[var(--muted)] tc-venue">
          {m.venue ?? "-"}
          {m.city ? ` - ${m.city}` : ""}
        </td>
        <td className="min-w-[10rem]" data-label="Arbitres" onClick={(e) => e.stopPropagation()}>
          {m.designations.length === 0 ? (
            <span className="text-[var(--muted)]">Aucun arbitre (0/{m.refereesRequired})</span>
          ) : (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {m.designations.map((d) => (
                <span key={d.id} className="inline-flex items-center gap-1">
                  <Link
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
                  <ConflictBadge conflict={d.conflict} />
                  <form action={removeDesignation}>
                    <input type="hidden" name="designationId" value={d.id} />
                    <input type="hidden" name="matchId" value={m.id} />
                    <button
                      type="submit"
                      title="Retirer cette désignation"
                      className="text-[var(--danger)] hover:underline text-xs"
                    >
                      ×
                    </button>
                  </form>
                </span>
              ))}
              {m.designations.length < m.refereesRequired && (
                <span className="text-[var(--muted)] text-xs">
                  ({m.designations.length}/{m.refereesRequired})
                </span>
              )}
            </div>
          )}
          {status === "incomplet" && (
            <form action={designFormAction} className="flex items-center gap-1 mt-1">
              <input type="hidden" name="matchId" value={m.id} />
              <select
                name="refereeId"
                required
                defaultValue=""
                aria-label="Arbitre à désigner"
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
          {confirming && (
            <ConfirmModal
              title={`Désigner ${confirmedReferee ? `${confirmedReferee.firstName} ${confirmedReferee.lastName}` : "cet arbitre"} malgré tout ?`}
              message={`${designState?.error ?? ""} Vous pouvez tout de même le désigner.`}
              confirmLabel="Désigner quand même"
              pending={isConfirming}
              onConfirm={confirmConflict}
              onCancel={() => setDismissed(designState)}
            >
              <GroupChoices
                groups={designState?.groups ?? []}
                refereeName={confirmedReferee ? `${confirmedReferee.firstName} ${confirmedReferee.lastName}` : "l'arbitre"}
                value={addTo}
                onChange={setAddTo}
              />
            </ConfirmModal>
          )}
          {designState?.error && !designState.confirm && (
            <p role="alert" className="text-xs text-[var(--danger)] mt-1 max-w-xs whitespace-normal">
              {designState.error}
            </p>
          )}
          {designState?.warning && (
            <p role="status" className="text-xs text-[var(--warning)] mt-1 max-w-xs whitespace-normal">
              ⚠ Désigné malgré : {designState.warning}
            </p>
          )}
        </td>
        <td className="tc-status">
          <StatusBadge status={status} />
        </td>
        <td className="text-right whitespace-nowrap tc-actions" onClick={(e) => e.stopPropagation()}>
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
                      <div className="table-shell table-cards overflow-x-auto">
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
                                <td className="font-medium whitespace-nowrap tc-team">{o.nom || "-"} {o.prenom || ""}</td>
                                <td className="whitespace-nowrap tc-hide-sm">{o.prenom || "-"}</td>
                                <td className="whitespace-nowrap" data-label="Fonction">{o.fonction || "-"}</td>
                                <td className="whitespace-nowrap text-[var(--muted)]" data-label="N° licence">{o.licence || "-"}</td>
                                <td data-label="Présence">
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
