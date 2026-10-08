/**
 * Message affiché quand un arbitre a déjà un match sur le créneau (ou n'a pas
 * le temps de rejoindre l'autre gymnase). Fichier sans dépendance serveur :
 * importé aussi bien par le moteur de désignation que par les composants client.
 */
export const SCHEDULING_CONFLICT_MESSAGE =
  "Cet arbitre a déjà un match sur ce créneau (ou pas assez de temps pour rejoindre l'autre gymnase).";

/** Groupes proposés à l'ajout dans la fenêtre de confirmation, passés en adresse (id~libellé,id~libellé). */
export function encodeGroups(groups: { id: string; label: string }[] | undefined): string {
  return (groups ?? []).map((g) => `${g.id}~${g.label.replace(/[~,]/g, " ")}`).join(",");
}
export function decodeGroups(value: string | undefined): { id: string; label: string }[] {
  return (value ?? "")
    .split(",")
    .filter(Boolean)
    .map((part) => {
      const [id, ...rest] = part.split("~");
      return { id, label: rest.join("~") };
    });
}
