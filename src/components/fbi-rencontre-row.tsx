"use client";

import { useState, useTransition } from "react";
import type { FbiDesignationRow } from "@/lib/fbi/searchDesignations";
import type { FbiRencontreDetail } from "@/lib/fbi/detail";

const presenceStyles: Record<string, string> = {
  "Présent": "text-[var(--success)] bg-[var(--success-bg)]",
  "Absent": "text-[var(--danger)] bg-[var(--danger-bg)]",
};

const etatStyles: Record<string, string> = {
  "Complète": "text-[var(--success)] bg-[var(--success-bg)]",
  "Incomplète": "text-[var(--warning)] bg-[var(--warning-bg)]",
};

function EtatBadge({ etat }: { etat: string }) {
  return (
    <span className={`badge ${etatStyles[etat] ?? "text-[var(--muted)] bg-[var(--neutral-bg)]"}`}>
      {etat || "-"}
    </span>
  );
}

/** Ligne d'une rencontre FBI dans /fbi, avec sa fiche détail dépliable juste en dessous (chargée à la demande). */
export function FbiRencontreRow({ r }: { r: FbiDesignationRow }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<FbiRencontreDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    setOpen((v) => !v);
    if (detail || error || isPending || !r.idRencontre) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/fbi-sync?detail=${r.idRencontre}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
        setDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  }

  return (
    <>
      <tr>
        <td className="whitespace-nowrap">
          {r.heure === "00:00" ? <span className="text-[var(--muted)]">À fixer</span> : r.heure}
        </td>
        <td className="whitespace-nowrap text-[var(--muted)]">
          {r.code}
          {r.poule ? ` · ${r.poule}` : ""}
        </td>
        <td className="text-right text-[var(--muted)]">{r.numero}</td>
        <td className="font-medium whitespace-nowrap">{r.equipe1}</td>
        <td className="font-medium whitespace-nowrap">{r.equipe2}</td>
        <td className="whitespace-nowrap text-[var(--muted)]">
          {r.salle}
          {r.ville ? ` - ${r.ville}` : ""}
        </td>
        <td>
          <EtatBadge etat={r.etat} />
        </td>
        <td className="whitespace-nowrap">
          {r.idRencontre && (
            <button
              type="button"
              onClick={toggle}
              className="text-[var(--accent)] hover:underline text-xs inline-flex items-center gap-1"
            >
              {open ? "Masquer" : "Détail"}
              <span aria-hidden>{open ? "▲" : "▼"}</span>
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8} className="bg-[var(--neutral-bg)] p-0">
            <div className="p-4 space-y-3">
              {isPending && !detail && !error && (
                <p className="text-sm text-[var(--muted)]">Chargement…</p>
              )}
              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
              {detail && (
                <>
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Officiels désignés ({detail.officiels.length})
                    </h3>
                    {detail.officiels.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">
                        Aucun officiel désigné sur FBI pour cette rencontre.
                      </p>
                    ) : (
                      <div className="table-shell overflow-x-auto">
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
                                <td className="font-medium whitespace-nowrap">{o.nom || "-"}</td>
                                <td className="whitespace-nowrap">{o.prenom || "-"}</td>
                                <td className="whitespace-nowrap">{o.fonction || "-"}</td>
                                <td className="whitespace-nowrap text-[var(--muted)]">{o.licence || "-"}</td>
                                <td>
                                  {o.presence ? (
                                    <span
                                      className={`badge ${
                                        presenceStyles[o.presence] ?? "text-[var(--muted)] bg-[var(--neutral-bg)]"
                                      }`}
                                    >
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
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Rencontre
                      </h3>
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
