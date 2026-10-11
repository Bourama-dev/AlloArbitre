"use client";

import { useState } from "react";

/** Copie un texte dans le presse-papiers (avec repli si l'API n'est pas disponible). */
export function CopyButton({ text, label = "Copier", className = "btn btn-secondary text-xs" }: { text: string; label?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "ok" | "error">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("ok");
    } catch {
      try {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const done = document.execCommand("copy");
        document.body.removeChild(area);
        setState(done ? "ok" : "error");
      } catch {
        setState("error");
      }
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {state === "ok" ? "Copié ✓" : state === "error" ? "Copie impossible" : label}
    </button>
  );
}
