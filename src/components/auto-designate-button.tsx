"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  applyAutoDesignation,
  previewAutoDesignation,
  type AutoDesignateSummary,
  type PlanItem,
} from "@/lib/actions/auto-designate-actions";

/**
 * Désignation automatique d'un match : calcule la meilleure suggestion pour
 * chaque place vacante (mêmes règles que l'auto-désignation en lot : arbitres
 * ayant répondu à la campagne de disponibilités, distance, règles...), la
 * présente dans une fenêtre, et ne crée les désignations qu'après validation.
 */
export function AutoDesignateButton({ matchId, slotsLeft }: { matchId: string; slotsLeft: number }) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanItem[] | null>(null);
  const [result, setResult] = useState<AutoDesignateSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComputing, startCompute] = useTransition();
  const [isApplying, startApply] = useTransition();

  const picks = (plan ?? []).filter((p): p is PlanItem & { refereeId: string } => !!p.refereeId);

  function compute() {
    setError(null);
    setResult(null);
    startCompute(async () => {
      try {
        setPlan(await previewAutoDesignation([matchId]));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Calcul impossible.");
      }
    });
  }

  function apply() {
    startApply(async () => {
      try {
        const res = await applyAutoDesignation(picks.map((p) => ({ matchId: p.matchId, refereeId: p.refereeId })));
        setResult(res);
        setPlan(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Désignation impossible.");
        setPlan(null);
      }
    });
  }

  return (
    <>
      <button type="button" onClick={compute} disabled={isComputing} className="btn btn-primary w-full sm:w-auto">
        {isComputing && <span className="spinner" aria-hidden />}
        {isComputing ? "Calcul…" : `Désignation automatique (${slotsLeft} place${slotsLeft > 1 ? "s" : ""})`}
      </button>

      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
      {result && (
        <div role="status" className="text-sm space-y-1">
          {result.assigned > 0 && (
            <p className="text-[var(--success)]">
              {result.assigned} arbitre{result.assigned > 1 ? "s" : ""} désigné{result.assigned > 1 ? "s" : ""}.
            </p>
          )}
          {result.errors.map((e) => (
            <p key={e} className="text-[var(--danger)]">
              {e}
            </p>
          ))}
        </div>
      )}

      {plan && (
        <ConfirmModal
          title={picks.length > 0 ? "Désignation automatique : proposition" : "Aucune désignation automatique possible"}
          message={
            picks.length > 0
              ? "Voici les arbitres proposés. Rien n’est enregistré avant votre validation."
              : "Aucun arbitre ne peut être désigné automatiquement sur ce match. Vous pouvez désigner à la main depuis les suggestions."
          }
          confirmLabel={picks.length > 0 ? "Valider et désigner" : "Fermer"}
          pending={isApplying}
          onConfirm={picks.length > 0 ? apply : () => setPlan(null)}
          onCancel={() => setPlan(null)}
        >
          <ul className="space-y-2 max-h-[40vh] overflow-y-auto text-sm">
            {plan.map((p, i) => (
              <li key={`${p.refereeId ?? "none"}-${i}`} className="rounded-lg border border-[var(--border)] p-3 space-y-0.5">
                <p className="font-semibold">{p.refereeName ?? "Aucun arbitre"}</p>
                <p className="text-xs text-[var(--muted)]">{p.reason}</p>
              </li>
            ))}
          </ul>
        </ConfirmModal>
      )}
    </>
  );
}
