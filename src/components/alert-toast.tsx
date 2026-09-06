"use client";

import { useState } from "react";

type Variant = "error" | "warning" | "success";

const VARIANT_CLASS: Record<Variant, string> = {
  error: "text-[var(--danger)] bg-[var(--danger-bg)] border-[var(--danger)]/20",
  warning: "text-[var(--warning)] bg-[var(--warning-bg)] border-[var(--warning)]/20",
  success: "text-[var(--success)] bg-[var(--success-bg)] border-[var(--success)]/20",
};

/** Pop-up d'alerte : notifie qu'une action n'est pas possible (error) ou pas conseillée (warning). */
export function AlertToast({ message, variant = "error" }: { message: string; variant?: Variant }) {
  const [dismissed, setDismissed] = useState(false);
  if (!message || dismissed) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-30 flex justify-center px-4 pointer-events-none">
      <div
        role="alert"
        className={`pointer-events-auto max-w-lg w-full border rounded-lg shadow-lg px-4 py-3 text-sm flex items-start gap-3 ${VARIANT_CLASS[variant]}`}
      >
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fermer"
          className="shrink-0 font-bold leading-none opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
