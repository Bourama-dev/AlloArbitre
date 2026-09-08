"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MatchesTable } from "@/components/matches-table";
import { applyRefereeToMatches } from "@/lib/actions/auto-designate-actions";
import type { AutoDesignateSummary } from "@/lib/actions/auto-designate-actions";
import type { MatchWithRelations } from "@/lib/matches";

/** Coche plusieurs matchs incomplets et désigne le même arbitre sur tous en un clic. */
export function MultiDesignatePanel({
  refereeId,
  matches,
}: {
  refereeId: string;
  matches: MatchWithRelations[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AutoDesignateSummary | null>(null);
  const [isApplying, startApply] = useTransition();

  function handleSubmit() {
    setError(null);
    setResult(null);
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const matchIds = formData.getAll("matchIds").map(String);
    if (matchIds.length === 0) {
      setError("Sélectionnez au moins un match.");
      return;
    }
    startApply(async () => {
      const res = await applyRefereeToMatches(refereeId, matchIds);
      setResult(res);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <form ref={formRef}>
        {matches.length > 0 && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isApplying}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            {isApplying && <span className="spinner" aria-hidden />}
            {isApplying ? "Désignation en cours…" : "Désigner sur les matchs sélectionnés"}
          </button>
        )}
        <div className="mt-3">
          <MatchesTable matches={matches} selectable />
        </div>
      </form>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger-bg)] rounded-lg p-3">{error}</p>
      )}

      {result && (
        <div className="text-sm rounded-lg bg-[var(--success-bg)] text-[var(--success)] px-3 py-2 space-y-1">
          <p>{result.assigned} désignation(s) créée(s).</p>
          {result.errors.length > 0 && (
            <p className="text-[var(--danger)]">{result.errors.join(" | ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
