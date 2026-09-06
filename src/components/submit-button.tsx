"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/** Bouton de soumission de formulaire (action serveur) qui affiche un indicateur de chargement pendant la requête. */
export function SubmitButton({
  children,
  pendingLabel = "Chargement…",
  className = "btn btn-primary",
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} inline-flex items-center gap-2`}
    >
      {pending && <span className="spinner" aria-hidden />}
      {pending ? pendingLabel : children}
    </button>
  );
}
