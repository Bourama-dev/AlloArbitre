"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FbiPushMatchResult } from "@/lib/fbi/push";

export function ImportFbiMatchesButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function importNow() {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/fbi-sync`);
        const data = await res.json();
        if (!res.ok) {
          setIsError(true);
          setMessage(data.error ?? "Erreur inconnue");
          return;
        }
        const s = data.import;
        setIsError(false);
        setMessage(
          s
            ? `${s.created} match(s) créé(s), ${s.updated} mis à jour.${s.competitionLevelsCreated.length ? ` Niveaux créés : ${s.competitionLevelsCreated.join(", ")}.` : ""}${s.errors.length ? ` Erreurs : ${s.errors.join(" | ")}` : ""}`
            : "Import non déclenché (droits insuffisants)."
        );
        router.refresh();
      } catch (err) {
        setIsError(true);
        setMessage(err instanceof Error ? err.message : "Erreur réseau");
      }
    });
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={importNow}
        disabled={isPending}
        className="btn btn-secondary inline-flex items-center gap-2"
      >
        {isPending && <span className="spinner" aria-hidden />}
        {isPending ? "Import en cours…" : "Importer le calendrier depuis FBI"}
      </button>
      {message && (
        <p className={`text-sm ${isError ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}>{message}</p>
      )}
    </div>
  );
}

export function PushAllToFbiButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<FbiPushMatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pushAll() {
    setResults(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/fbi-sync?pushAll=1`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erreur inconnue");
          return;
        }
        setResults(data.results ?? []);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur réseau");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={pushAll}
        disabled={isPending}
        className="btn btn-primary inline-flex items-center gap-2"
      >
        {isPending && <span className="spinner" aria-hidden />}
        {isPending ? "Envoi en cours…" : "Tout pousser vers FBI"}
      </button>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {results && (
        <div className="card p-3 text-sm space-y-2 max-h-72 overflow-y-auto">
          {results.length === 0 && <p className="text-[var(--muted)]">Aucun match à pousser.</p>}
          {results.map((r) => (
            <div key={r.matchId} className="border-b border-[var(--border)] last:border-0 pb-2 last:pb-0">
              <p className="font-medium">{r.matchLabel}</p>
              {r.error && <p className="text-[var(--danger)] text-xs">{r.error}</p>}
              {r.positions.map((p) => (
                <p
                  key={p.position}
                  className={
                    p.status === "ok"
                      ? "text-xs text-[var(--success)]"
                      : p.status === "skip"
                        ? "text-xs text-[var(--muted)]"
                        : "text-xs text-[var(--danger)]"
                  }
                >
                  A{p.position} {p.referee} : {p.message}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
