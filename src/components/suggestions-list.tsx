"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import type { RefereeSuggestion, IneligibleReferee } from "@/lib/suggestions";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matches(s: RefereeSuggestion, term: string) {
  return normalize(`${s.firstName} ${s.lastName}`).includes(term);
}

export function SuggestionsList({
  eligible,
  ineligible,
  designateAction,
}: {
  eligible: RefereeSuggestion[];
  ineligible: IneligibleReferee[];
  designateAction: (formData: FormData) => void | Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const term = normalize(search.trim());

  const filteredEligible = useMemo(
    () => (term ? eligible.filter((s) => matches(s, term)) : eligible),
    [eligible, term]
  );
  const filteredIneligible = useMemo(
    () => (term ? ineligible.filter((s) => matches(s, term)) : ineligible),
    [ineligible, term]
  );

  function renderRow(s: RefereeSuggestion, reasons?: string[]) {
    return (
      <li key={s.id} className="px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="avatar-chip">
            {s.firstName.charAt(0)}
            {s.lastName.charAt(0)}
          </span>
          <div className="min-w-0">
            <Link href={`/arbitres/${s.id}`} className="hover:underline font-medium">
              {s.firstName} {s.lastName}
            </Link>
            <div className="text-[var(--muted)] text-xs">
              {s.levelLabel} · {s.zone ?? "zone inconnue"} · {s.currentLoad} désignation
              {s.currentLoad > 1 ? "s" : ""}
              {s.age != null && <> · {s.age} ans</>}
              {s.distanceKm != null && (
                <>
                  {" "}
                  · <span title={s.distanceByRoad ? "Distance par la route" : "Distance à vol d'oiseau"}>
                    {s.distanceByRoad ? "" : "~"}
                    {s.distanceKm.toFixed(1)} km{s.distanceByRoad ? " (route)" : ""}
                  </span>
                  {s.estimatedPayment != null && <> · {s.estimatedPayment.toFixed(2)} €</>}
                </>
              )}
              {s.groupLabels.length > 0 && <> · {s.groupLabels.join(", ")}</>}
            </div>
            {s.sameVenueDouble && !reasons && (
              <span className="inline-block mt-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded bg-[var(--brand-tint)] text-[var(--brand)]">
                Doublé possible : déjà dans ce gymnase ce jour-là
              </span>
            )}
            {reasons && reasons.length > 0 && (
              <div className="text-[var(--danger)] text-xs mt-0.5">{reasons.join(" · ")}</div>
            )}
            {!reasons && s.why.length > 0 && (
              <details className="text-xs mt-0.5">
                <summary className="cursor-pointer text-[var(--accent)]">Pourquoi ?</summary>
                <ul className="list-disc pl-4 text-[var(--muted)] mt-1 space-y-0.5">
                  {s.why.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
        <form action={designateAction} className="shrink-0">
          <input type="hidden" name="refereeId" value={s.id} />
          <SubmitButton
            className={`${reasons ? "btn btn-secondary" : "btn btn-primary"} w-full sm:w-auto`}
            pendingLabel="Désignation…"
          >
            Désigner
          </SubmitButton>
        </form>
      </li>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un arbitre par nom…"
        className="input w-full sm:w-72 sticky top-2 z-10"
      />

      <div>
        <h3 className="field-label mb-1">Arbitres compatibles ({filteredEligible.length})</h3>
        {filteredEligible.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            {eligible.length === 0
              ? "Aucun arbitre disponible ne correspond aux critères pour ce match."
              : "Aucun résultat pour cette recherche."}
          </p>
        ) : (
          <ul className="table-shell card-list divide-y divide-[var(--border)]">
            {filteredEligible.map((s) => renderRow(s))}
          </ul>
        )}
      </div>

      {ineligible.length > 0 && (
        <div>
          <h3 className="field-label mb-1">Autres arbitres ({filteredIneligible.length})</h3>
          {filteredIneligible.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Aucun résultat pour cette recherche.</p>
          ) : (
            <ul className="table-shell card-list divide-y divide-[var(--border)]">
              {filteredIneligible.map((s) => renderRow(s, s.reasons))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
