"use client";

import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { INDIVIDUAL_REMINDER, MESSAGE_TEMPLATES, fillTemplate } from "@/lib/communication-templates";

export type PendingReferee = { id: string; firstName: string; lastName: string; licence: string | null; phone: string | null };

/** Messages prêts à copier + relances individuelles des arbitres sans compte. */
export function CommunicationStudio({ defaultLink, pending }: { defaultLink: string; pending: PendingReferee[] }) {
  const [link, setLink] = useState(defaultLink);
  const [search, setSearch] = useState("");

  const shown = pending.filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.trim().toLowerCase()));
  const allReminders = pending
    .map((p) => `${p.lastName} ${p.firstName} : ${fillTemplate(INDIVIDUAL_REMINDER, { LIEN: link, PRENOM: p.firstName, LICENCE: p.licence ?? undefined })}`)
    .join("\n\n");

  return (
    <div className="space-y-6">
      <div className="card p-4 space-y-2">
        <label htmlFor="app-link" className="field-label">
          Lien de l&apos;application (inséré dans les messages)
        </label>
        <input id="app-link" value={link} onChange={(e) => setLink(e.target.value)} className="input w-full" inputMode="url" />
        <p className="text-xs text-[var(--muted)]">
          Par défaut : la page de connexion arbitre de ce site. Remplacez-le si vous utilisez une autre adresse.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Messages au groupe</h2>
        {MESSAGE_TEMPLATES.map((t) => {
          const text = fillTemplate(t.text, { LIEN: link });
          return (
            <details key={t.id} className="card p-4">
              <summary className="cursor-pointer list-none flex items-start justify-between gap-3">
                <span>
                  <span className="font-semibold text-sm block">{t.title}</span>
                  <span className="text-xs text-[var(--muted)]">{t.when}</span>
                </span>
              </summary>
              <div className="mt-3 space-y-3">
                <pre className="whitespace-pre-wrap break-words text-sm font-sans bg-[var(--neutral-bg)] rounded-xl p-3">{text}</pre>
                <CopyButton text={text} label="Copier le message" className="btn btn-primary text-sm" />
              </div>
            </details>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold">Relances individuelles ({pending.length})</h2>
            <p className="text-xs text-[var(--muted)]">Arbitres actifs qui n&apos;ont pas encore activé leur compte.</p>
          </div>
          {pending.length > 0 && <CopyButton text={allReminders} label="Copier toutes les relances" />}
        </div>
        {pending.length > 6 && (
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un arbitre" className="input w-full" />
        )}
        {pending.length === 0 ? (
          <p className="text-sm text-[var(--success)] bg-[var(--success-bg)] rounded-xl p-3">
            Tous les arbitres actifs ont activé leur compte. 🎉
          </p>
        ) : (
          <ul className="card divide-y divide-[var(--border)]">
            {shown.map((p) => {
              const text = fillTemplate(INDIVIDUAL_REMINDER, { LIEN: link, PRENOM: p.firstName, LICENCE: p.licence ?? undefined });
              return (
                <li key={p.id} className="p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {p.licence ?? "licence manquante"}
                      {p.phone ? ` · ${p.phone}` : ""}
                    </p>
                  </div>
                  <CopyButton text={text} label="Copier la relance" />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
