"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/confirm-modal";
import { SCHEDULING_CONFLICT_MESSAGE } from "@/lib/designation-messages";

/**
 * Confirmation d'une désignation en conflit d'horaire, pour les écrans qui
 * passent par une redirection (page Matchs, fiche d'un match) : la page se
 * recharge avec ?confirm=conflit et affiche cette fenêtre. « Confirmer »
 * renvoie la désignation avec confirmConflict=1 ; « Annuler » retire le
 * paramètre de l'adresse.
 */
export function ConflictConfirm({
  refereeName,
  fields,
  action,
}: {
  refereeName: string;
  /** Champs cachés renvoyés à l'action (matchId, refereeId...). */
  fields: Record<string, string>;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);

  return (
    <>
      <form ref={formRef} action={action} className="hidden">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input type="hidden" name="confirmConflict" value="1" />
      </form>
      <ConfirmModal
        title={`Désigner ${refereeName} malgré le conflit d'horaire ?`}
        message={`${SCHEDULING_CONFLICT_MESSAGE} Vous pouvez tout de même le désigner.`}
        confirmLabel="Désigner quand même"
        pending={pending}
        onConfirm={() => {
          setPending(true);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => router.replace(pathname)}
      />
    </>
  );
}
