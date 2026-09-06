"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MatchesTable } from "@/components/matches-table";
import { previewAutoDesignation, applyAutoDesignation } from "@/lib/actions/auto-designate-actions";
import type { PlanItem, AutoDesignateSummary } from "@/lib/actions/auto-designate-actions";
import type { MatchWithRelations } from "@/lib/matches";

export function AutoDesignatePanel({ matches }: { matches: MatchWithRelations[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const [plan, setPlan] = useState<PlanItem[] | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [result, setResult] = useState<AutoDesignateSummary | null>(null);
  const [isPreviewing, startPreview] = useTransition();
  const [isApplying, startApply] = useTransition();

  function handlePreview() {
    setPlanError(null);
    setResult(null);
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const matchIds = formData.getAll("matchIds").map(String);
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
      <form ref={formRef}>
        {matches.length > 0 && (
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            {isPreviewing && <span className="spinner" aria-hidden />}
            {isPreviewing ? "Calcul en cours…" : "Auto-désignation des matchs sélectionnés"}
          </button>
        )}
        <div className="mt-3">
          <MatchesTable matches={matches} selectable />
        </div>
      </form>

      {planError && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger-bg)] rounded-lg p-3">
          {planError}
        </p>
      )}

      {result && (
        <div className="text-sm rounded-lg bg-[var(--success-bg)] text-[var(--success)] px-3 py-2 space-y-1">
          <p>{result.assigned} désignation(s) créée(s).</p>
          {result.errors.length > 0 && (
            <p className="text-[var(--danger)]">{result.errors.join(" | ")}</p>
          )}
        </div>
      )}

      {plan && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
          <div className="card animate-scale-in max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-lg">Récapitulatif de l&apos;auto-désignation</h2>
              <p className="text-xs text-[var(--muted)] mt-1">
                Vérifiez les désignations proposées avant de les appliquer. Rien n&apos;est
                encore enregistré.
              </p>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {plan.map((item, i) => (
                <li key={i} className="py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.matchLabel}</span>
                    <span
                      className={
                        item.refereeId ? "text-[var(--success)]" : "text-[var(--danger)]"
                      }
                    >
                      {item.refereeName ?? "Aucun arbitre disponible"}
                    </span>
                  </div>
                  {item.refereeId && (
                    <details className="mt-1">
                      <summary className="text-xs text-[var(--accent)] cursor-pointer">
                        Pourquoi cet arbitre ?
                      </summary>
                      <p className="text-xs text-[var(--muted)] mt-1">{item.reason}</p>
                    </details>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPlan(null)}
                disabled={isApplying}
              >
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
