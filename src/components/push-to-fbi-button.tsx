"use client";

import { useState, useTransition } from "react";
import type { FbiPushMatchResult } from "@/lib/fbi/push";

const STATUS_STYLE: Record<FbiPushMatchResult["positions"][number]["status"], string> = {
  ok: "text-[var(--success)]",
  skip: "text-[var(--muted)]",
  conflict: "text-[var(--danger)]",
  error: "text-[var(--danger)]",
};

export function PushToFbiButton({ matchId }: { matchId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FbiPushMatchResult | { error: string } | null>(null);

  function push() {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/fbi-sync?push=${encodeURIComponent(matchId)}`);
        const text = await res.text();
        let data: { error?: string; results?: FbiPushMatchResult[] };
        try {
          data = JSON.parse(text);
        } catch {
          // Page d'erreur HTML de Vercel (délai dépassé...) au lieu du JSON attendu.
          setResult({
            error: `Le serveur a renvoyé une erreur HTTP ${res.status}${res.status === 504 ? " (délai dépassé)" : ""}. Relancez : ce qui est déjà sur FBI sera ignoré.`,
          });
          return;
        }
        if (!res.ok) {
          setResult({ error: data.error ?? "Erreur inconnue" });
          return;
        }
        setResult(data.results?.[0] ?? { error: "Réponse inattendue" });
      } catch (err) {
        setResult({ error: err instanceof Error ? err.message : "Erreur réseau" });
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={push}
        disabled={isPending}
        className="btn btn-secondary text-xs px-2 py-1 inline-flex items-center gap-1"
      >
        {isPending && <span className="spinner" aria-hidden />}
        {isPending ? "Envoi…" : "Pousser vers FBI"}
      </button>
      {result && "error" in result && (
        <span className="text-xs text-[var(--danger)] max-w-[16rem] text-right">{result.error}</span>
      )}
      {result && "positions" in result && (
        <div className="text-xs text-right space-y-0.5">
          {result.error && <p className="text-[var(--danger)]">{result.error}</p>}
          {result.positions.map((p) => (
            <p key={p.position} className={STATUS_STYLE[p.status]}>
              A{p.position} {p.referee} : {p.message}
            </p>
          ))}
          {result.observateurs && <p className="text-[var(--muted)]">{result.observateurs}</p>}
        </div>
      )}
    </div>
  );
}
