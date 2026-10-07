"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * Fenêtre de confirmation : feuille du bas sur mobile, boîte centrée au-dessus.
 * Le focus part sur « Annuler » (choix prudent par défaut), Échap ou un clic
 * à côté annule.
 */
export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  pending = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Rendu à la racine de la page (portail) : une carte animée parente crée un
  // repère de positionnement qui enfermerait et couperait la fenêtre. Faux côté
  // serveur, vrai une fois hydraté (pas de décalage d'hydratation).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    if (!mounted) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancelRef.current();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 sm:p-4 animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      onClick={(e) => e.target === e.currentTarget && !pending && onCancel()}
    >
      <div className="sheet-modal card w-full max-w-md p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span
            className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-[var(--warning-bg)] text-[var(--warning)] text-lg"
            aria-hidden
          >
            ⚠
          </span>
          <div className="space-y-1 min-w-0">
            <h2 id="confirm-title" className="font-bold text-base leading-snug">
              {title}
            </h2>
            <p id="confirm-message" className="text-sm text-[var(--muted)]">
              {message}
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={pending}>
            {pending && <span className="spinner" aria-hidden />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
