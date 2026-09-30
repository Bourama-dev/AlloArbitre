"use client";

import { useState, useTransition } from "react";
import { generatePersonalLink } from "@/lib/actions/referee-access-actions";
import { CopyText } from "@/components/copy-text";

/** Génère le lien personnel d'accès à l'espace arbitre, à envoyer en privé (WhatsApp). */
export function PersonalLinkButton({ refereeId, firstName }: { refereeId: string; firstName: string }) {
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await generatePersonalLink(refereeId);
      if (result.ok) setUrl(result.url);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={generate} disabled={pending} className="btn btn-secondary text-xs">
        {pending ? "Génération…" : url ? "Générer un nouveau lien" : "Générer un lien personnel"}
      </button>
      <p className="text-xs text-[var(--muted)]">
        Pour une première connexion sans licence ni date de naissance, ou un mot de passe oublié. Valable 1 h, usage
        unique : à envoyer en privé, jamais dans le groupe.
      </p>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      {url && (
        <CopyText
          text={`Bonjour ${firstName}, voici ton lien personnel pour accéder à ton espace arbitre AlloArbitre (valable 1 h, à usage unique) : ${url}\nTu pourras y choisir ton mot de passe.`}
        />
      )}
    </div>
  );
}
