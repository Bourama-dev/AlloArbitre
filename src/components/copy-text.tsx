"use client";

import { useState } from "react";

/** Texte prêt à coller (message WhatsApp, lien) avec bouton « Copier » et lien de partage WhatsApp. */
export function CopyText({ text, label, whatsapp = true }: { text: string; label?: string; whatsapp?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2">
      {label && <p className="field-label">{label}</p>}
      <textarea readOnly value={text} rows={Math.min(10, text.split("\n").length + 1)} className="input w-full text-sm font-mono" />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="btn btn-primary text-xs">
          {copied ? "Copié !" : "Copier"}
        </button>
        {whatsapp && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary text-xs"
          >
            Ouvrir dans WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
