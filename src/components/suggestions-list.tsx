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
      <li key={s.id} className="px-4 py-2.5 text-sm flex items-center justify-between gap-3">
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
              {s.distanceKm != null && (
                <>
                  {" "}
                  · {s.distanceKm.toFixed(1)} km · {s.estimatedPayment!.toFixed(2)} €
                </>
              )}
            </div>
            {reasons && reasons.length > 0 && (
              <div className="text-[var(--danger)] text-xs mt-0.5">{reasons.join(" · ")}</div>
            )}
          </div>
        </div>
        <form action={designateAction}>
          <input type="hidden" name="refereeId" value={s.id} />
          <SubmitButton
            className={reasons ? "btn btn-secondary" : "btn btn-primary"}
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
        className="input w-full sm:w-72"
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
          <ul className="table-shell divide-y divide-[var(--border)]">
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
            <ul className="table-shell divide-y divide-[var(--border)]">
              {filteredIneligible.map((s) => renderRow(s, s.reasons))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
