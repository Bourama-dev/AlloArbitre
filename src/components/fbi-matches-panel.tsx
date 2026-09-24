"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { matchStatus } from "@/lib/match-status";
import { FbiMatchRow } from "@/components/fbi-match-row";
import { previewAutoDesignation, applyAutoDesignation } from "@/lib/actions/auto-designate-actions";
import type { PlanItem, AutoDesignateSummary } from "@/lib/actions/auto-designate-actions";
import type { ActiveReferee, MatchWithRelations } from "@/lib/matches";

/**
 * Tableau unique des matchs AlloArbitre de la période filtrée (un seul
 * tableau, pas un doublon FBI à côté) : désignation directe, détail FBI
 * dépliable par ligne, et sélection multiple pour l'auto-désignation en lot.
 */
export function FbiMatchesPanel({
  byDay,
  referees,
  designateAction,
}: {
  byDay: [string, MatchWithRelations[]][];
  referees: ActiveReferee[];
  designateAction: (formData: FormData) => void | Promise<void>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const hasIncomplete = byDay.some(([, matches]) => matches.some((m) => matchStatus(m) === "incomplet"));

  const [plan, setPlan] = useState<PlanItem[] | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [result, setResult] = useState<AutoDesignateSummary | null>(null);
  const [isPreviewing, startPreview] = useTransition();
  const [isApplying, startApply] = useTransition();

  function handlePreview() {
    setPlanError(null);
    setResult(null);
    if (!containerRef.current) return;
    // Un <form> englobant tout le tableau imbriquerait les <form> de retrait
    // de désignation et de désignation directe de chaque ligne (invalides en
    // HTML, le navigateur les ignorerait silencieusement) : on lit les cases
    // cochées directement dans le DOM plutôt que via FormData d'un <form>.
    const checked = containerRef.current.querySelectorAll<HTMLInputElement>('input[name="matchIds"]:checked');
    const matchIds = Array.from(checked).map((el) => el.value);
    if (matchIds.length === 0) {
      setPlanError("Sélectionnez au moins un match.");
      return;
    }
    startPreview(async () => {
      const p = await previewAutoDesignation(matchIds);
      setPlan(p);
    });
  }

  function handleConfirm() {
    if (!plan) return;
    const picks = plan
      .filter((item): item is PlanItem & { refereeId: string } => item.refereeId != null)
      .map((item) => ({ matchId: item.matchId, refereeId: item.refereeId }));
    startApply(async () => {
      const res = await applyAutoDesignation(picks);
      setResult(res);
      setPlan(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div ref={containerRef}>
        {hasIncomplete && (
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewing}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              {isPreviewing && <span className="spinner" aria-hidden />}
              {isPreviewing ? "Calcul en cours…" : "Auto-désignation des matchs sélectionnés"}
            </button>
          </div>
        )}

        {byDay.map(([day, matches]) => (
          <section key={day} className="space-y-2 mb-4">
            <h2 className="text-sm font-semibold">
              {day.charAt(0).toUpperCase() + day.slice(1)}{" "}
              <span className="font-normal text-[var(--muted)]">({matches.length})</span>
            </h2>
            <div className="table-shell overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    {hasIncomplete && <th className="w-8" />}
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
                  {matches.map((m) => (
                    <FbiMatchRow
                      key={m.id}
                      m={m}
                      referees={referees}
                      designateAction={designateAction}
                      selectable={hasIncomplete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {planError && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger-bg)] rounded-lg p-3">{planError}</p>
      )}

      {result && (
        <div className="text-sm rounded-lg bg-[var(--success-bg)] text-[var(--success)] px-3 py-2 space-y-1">
          <p>{result.assigned} désignation(s) créée(s).</p>
          {result.errors.length > 0 && <p className="text-[var(--danger)]">{result.errors.join(" | ")}</p>}
        </div>
      )}

      {plan && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
          <div className="card animate-scale-in max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-lg">Récapitulatif de l&apos;auto-désignation</h2>
              <p className="text-xs text-[var(--muted)] mt-1">
                Vérifiez les désignations proposées avant de les appliquer. Rien n&apos;est encore enregistré.
              </p>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {plan.map((item, i) => (
                <li key={i} className="py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.matchLabel}</span>
                    <span className={item.refereeId ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                      {item.refereeName ?? "Aucun arbitre disponible"}
                    </span>
                  </div>
                  {item.refereeId && (
                    <details className="mt-1">
                      <summary className="text-xs text-[var(--accent)] cursor-pointer">Pourquoi cet arbitre ?</summary>
                      <p className="text-xs text-[var(--muted)] mt-1">{item.reason}</p>
                    </details>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button type="button" className="btn btn-secondary" onClick={() => setPlan(null)} disabled={isApplying}>
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary inline-flex items-center gap-2"
                onClick={handleConfirm}
                disabled={isApplying}
              >
                {isApplying && <span className="spinner" aria-hidden />}
                {isApplying ? "Application…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
