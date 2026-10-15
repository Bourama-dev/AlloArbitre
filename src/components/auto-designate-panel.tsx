"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  applyAutoDesignation,
  previewAutoDesignation,
  type AutoDesignateSummary,
  type PlanItem,
} from "@/lib/actions/auto-designate-actions";

/**
 * Désignation automatique en lot : enveloppe la liste des matchs (cases à
 * cocher « matchIds » sur les matchs incomplets), calcule une proposition pour
 * la sélection et ne crée les désignations qu'après validation.
 */
export function AutoDesignatePanel({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [plan, setPlan] = useState<PlanItem[] | null>(null);
  const [result, setResult] = useState<AutoDesignateSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComputing, startCompute] = useTransition();
  const [isApplying, startApply] = useTransition();

  const picks = (plan ?? []).filter((p): p is PlanItem & { refereeId: string } => !!p.refereeId);

  // Pas de <form> englobant : le tableau contient déjà ses propres formulaires.
  function boxes() {
    return Array.from(containerRef.current?.querySelectorAll<HTMLInputElement>('input[name="matchIds"]') ?? []);
  }

  function selectAll(checked: boolean) {
    boxes().forEach((el) => {
      el.checked = checked;
    });
  }

  function compute() {
    setError(null);
    setResult(null);
    const matchIds = boxes()
      .filter((el) => el.checked)
      .map((el) => el.value);
    if (matchIds.length === 0) {
      setError("Cochez au moins un match incomplet.");
      return;
    }
    startCompute(async () => {
      try {
        setPlan(await previewAutoDesignation(matchIds));
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
        selectAll(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Désignation impossible.");
        setPlan(null);
      }
    });
  }

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={compute} disabled={isComputing} className="btn btn-primary">
          {isComputing && <span className="spinner" aria-hidden />}
          {isComputing ? "Calcul…" : "Désignation automatique de la sélection"}
        </button>
        <button type="button" className="chip-btn" onClick={() => selectAll(true)}>
          Tout cocher
        </button>
        <button type="button" className="chip-btn" onClick={() => selectAll(false)}>
          Tout décocher
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
      {result && (
        <div role="status" className="text-sm space-y-1">
          <p className="text-[var(--success)]">
            {result.assigned} désignation{result.assigned > 1 ? "s" : ""} créée{result.assigned > 1 ? "s" : ""}.
          </p>
          {result.errors.map((e) => (
            <p key={e} className="text-[var(--danger)]">
              {e}
            </p>
          ))}
        </div>
      )}

      {children}

      {plan && (
        <ConfirmModal
          title={picks.length > 0 ? "Désignation automatique : proposition" : "Aucune désignation automatique possible"}
          message={
            picks.length > 0
              ? `${picks.length} désignation${picks.length > 1 ? "s" : ""} proposée${picks.length > 1 ? "s" : ""}. Rien n’est enregistré avant votre validation.`
              : "Aucun arbitre ne peut être désigné automatiquement sur la sélection."
          }
          confirmLabel={picks.length > 0 ? "Valider et désigner" : "Fermer"}
          pending={isApplying}
          onConfirm={picks.length > 0 ? apply : () => setPlan(null)}
          onCancel={() => setPlan(null)}
        >
          <ul className="space-y-2 max-h-[50vh] overflow-y-auto text-sm">
            {plan.map((p, i) => (
              <li key={`${p.matchId}-${i}`} className="rounded-lg border border-[var(--border)] p-3 space-y-0.5">
                <p className="text-xs text-[var(--muted)]">{p.matchLabel}</p>
                <p className="font-semibold">{p.refereeName ?? "Aucun arbitre"}</p>
                <p className="text-xs text-[var(--muted)]">{p.reason}</p>
              </li>
            ))}
          </ul>
        </ConfirmModal>
      )}
    </div>
  );
}
